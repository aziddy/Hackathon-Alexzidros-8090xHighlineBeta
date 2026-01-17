import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/issues/[issueId]/steps - Get all steps for an issue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { issueId } = await params;

    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        project: { userId: session.user.id },
      },
      include: {
        atomicSteps: { orderBy: { order: "asc" } },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json(issue.atomicSteps);
  } catch (error) {
    console.error("Error fetching steps:", error);
    return NextResponse.json({ error: "Failed to fetch steps" }, { status: 500 });
  }
}

// PATCH /api/issues/[issueId]/steps/[stepId] - Update a step's status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { issueId } = await params;
    const body = await request.json();
    const { stepId, status } = body;

    if (!stepId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        project: { userId: session.user.id },
      },
      include: { atomicSteps: true },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Update step
    const step = await prisma.atomicStep.update({
      where: { id: stepId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
        verifiedVia: status === "COMPLETED" ? "manual" : null,
      },
    });

    // Recalculate progress
    const allSteps = await prisma.atomicStep.findMany({
      where: { issueId },
    });

    const completed = allSteps.filter((s) => s.status === "COMPLETED").length;
    const progress = Math.round((completed / allSteps.length) * 100);

    // Update issue status and progress
    let issueStatus = issue.status;
    if (progress === 100) {
      issueStatus = "DONE";
    } else if (progress > 0) {
      issueStatus = "IN_PROGRESS";
    }

    await prisma.issue.update({
      where: { id: issueId },
      data: {
        progressPercent: progress,
        status: issueStatus,
      },
    });

    return NextResponse.json({ step, progress });
  } catch (error) {
    console.error("Error updating step:", error);
    return NextResponse.json({ error: "Failed to update step" }, { status: 500 });
  }
}
