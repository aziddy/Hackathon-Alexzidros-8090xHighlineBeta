import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAtomicSteps } from "@/lib/cerebras";
import { DEFAULT_CHECK_METHOD, StepType, CheckMethod } from "@/types";

// POST /api/ai/generate-steps - Generate atomic steps using AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { issueId, title, body: issueBody, labels } = body;

    if (!issueId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify issue exists and belongs to user's project
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        project: { userId: session.user.id },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Generate steps using Cerebras AI
    const generatedSteps = await generateAtomicSteps(
      title,
      issueBody,
      labels || []
    );

    // Delete existing steps and create new ones
    await prisma.atomicStep.deleteMany({
      where: { issueId },
    });

    const createdSteps = await Promise.all(
      generatedSteps.map((step) => {
        // Get checkMethod from AI response or fall back to default for the step type
        const stepType = step.type as StepType;
        const checkMethod = (step.checkMethod as CheckMethod) || DEFAULT_CHECK_METHOD[stepType] || "MCP_OR_MANUAL";

        return prisma.atomicStep.create({
          data: {
            issueId,
            name: step.name,
            description: step.description,
            type: stepType as any,
            checkMethod: checkMethod as any,
            order: step.order,
            status: "PENDING",
          },
        });
      })
    );

    // Update issue progress
    await prisma.issue.update({
      where: { id: issueId },
      data: { progressPercent: 0 },
    });

    return NextResponse.json({ steps: createdSteps });
  } catch (error) {
    console.error("Error generating steps:", error);
    return NextResponse.json(
      { error: "Failed to generate steps" },
      { status: 500 }
    );
  }
}
