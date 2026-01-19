import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cerebras, MODEL } from "@/lib/cerebras";
import { buildChatSystemPrompt, parseActionFromResponse } from "@/lib/chat-utils";
import { createOctokit } from "@/lib/github";
import {
  executeGitHubAction,
  READ_ONLY_ACTIONS,
  CONFIRMATION_REQUIRED,
} from "@/lib/github-actions";
import { AtomicStep, ChatMessage, GitHubActionResult } from "@/types";

interface ChatRequestBody {
  issueId: string;
  projectId: string;
  message: string;
  issueContext: {
    title: string;
    body?: string;
    labels?: string[];
    steps: AtomicStep[];
    progress: number;
    githubNumber?: number;
  };
  chatHistory: ChatMessage[];
}

// POST /api/chat - Send message and get AI response
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ChatRequestBody = await request.json();
    const { projectId, message, issueContext, chatHistory } = body;

    if (!message || !issueContext || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get project for repo context
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const repoContext = {
      owner: project.githubRepoOwner,
      repo: project.githubRepoName,
    };

    // Get GitHub token for potential actions
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
    });

    // Build system prompt with repo context
    const systemPrompt = buildChatSystemPrompt(
      {
        title: issueContext.title,
        body: issueContext.body,
        labels: issueContext.labels,
        githubNumber: issueContext.githubNumber,
      },
      issueContext.steps,
      issueContext.progress,
      repoContext
    );

    // Build conversation history for context (limit to last 10 messages)
    const historyMessages = (chatHistory || [])
      .slice(-10)
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Call Cerebras API
    const response = await cerebras.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    // Type assertion for Cerebras SDK response
    const choices = (
      response as { choices: Array<{ message?: { content?: string } }> }
    ).choices;
    const content = choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from Cerebras");
    }

    // Parse actions from response
    const { cleanMessage, action, githubAction } =
      parseActionFromResponse(content);

    let githubActionResult: GitHubActionResult | null = null;
    let pendingGitHubAction: {
      type: string;
      params: Record<string, unknown>;
      requiresConfirmation: boolean;
    } | null = null;

    // Handle GitHub action if present
    if (githubAction && account?.access_token) {
      const octokit = createOctokit(account.access_token);

      if (READ_ONLY_ACTIONS.includes(githubAction.type)) {
        // Execute read actions immediately
        githubActionResult = await executeGitHubAction(
          octokit,
          repoContext,
          githubAction.type,
          githubAction.params
        );
      } else if (CONFIRMATION_REQUIRED.includes(githubAction.type)) {
        // Return pending action for confirmation
        pendingGitHubAction = {
          type: githubAction.type,
          params: githubAction.params,
          requiresConfirmation: true,
        };
      }
    }

    return NextResponse.json({
      message: cleanMessage,
      action,
      githubAction: pendingGitHubAction,
      githubActionResult,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
