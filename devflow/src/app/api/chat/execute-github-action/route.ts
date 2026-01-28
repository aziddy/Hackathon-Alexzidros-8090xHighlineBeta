import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOctokit } from "@/lib/github";
import { executeGitHubAction } from "@/lib/github-actions";
import { GitHubActionType } from "@/types";

interface ExecuteActionBody {
  projectId: string;
  actionType: GitHubActionType;
  params: Record<string, unknown>;
}

// POST /api/chat/execute-github-action - Execute a confirmed GitHub action
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ExecuteActionBody = await request.json();
    const { projectId, actionType, params } = body;

    if (!projectId || !actionType) {
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

    // Get GitHub token
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "GitHub not connected" },
        { status: 400 }
      );
    }

    const octokit = createOctokit(account.access_token);
    const repoContext = {
      owner: project.githubRepoOwner,
      repo: project.githubRepoName,
    };

    console.log(`[GitHub Action] Executing ${actionType}:`, {
      projectId,
      repoContext,
      params,
    });

    const result = await executeGitHubAction(
      octokit,
      repoContext,
      actionType,
      params
    );

    console.log(`[GitHub Action] Result for ${actionType}:`, {
      success: result.success,
      message: result.message,
      hasError: !!result.error,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error executing GitHub action:", error);
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
