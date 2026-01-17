import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cerebras, MODEL } from "@/lib/cerebras";
import { buildChatSystemPrompt } from "@/lib/chat-utils";
import { AtomicStep, ChatMessage } from "@/types";

interface ChatRequestBody {
  issueId: string;
  message: string;
  issueContext: {
    title: string;
    body?: string;
    labels?: string[];
    steps: AtomicStep[];
    progress: number;
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
    const { message, issueContext, chatHistory } = body;

    if (!message || !issueContext) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build system prompt with issue context
    const systemPrompt = buildChatSystemPrompt(
      {
        title: issueContext.title,
        body: issueContext.body,
        labels: issueContext.labels,
      },
      issueContext.steps,
      issueContext.progress
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
      max_tokens: 512,
    });

    // Type assertion for Cerebras SDK response
    const choices = (response as { choices: Array<{ message?: { content?: string } }> }).choices;
    const content = choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from Cerebras");
    }

    return NextResponse.json({ message: content });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
