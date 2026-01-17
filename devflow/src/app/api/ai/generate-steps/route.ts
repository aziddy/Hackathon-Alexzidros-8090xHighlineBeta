import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAtomicSteps } from "@/lib/cerebras";

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
      generatedSteps.map((step) =>
        prisma.atomicStep.create({
          data: {
            issueId,
            name: step.name,
            description: step.description,
            type: step.type as any,
            order: step.order,
            status: "PENDING",
          },
        })
      )
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
