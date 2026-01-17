import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/mcp/report-step - Report step completion from MCP/IDE
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueNumber, stepNumber, status, details } = body;

    if (!issueNumber || !stepNumber || !status) {
      return NextResponse.json(
        { error: "Missing required fields: issueNumber, stepNumber, and status are required" },
        { status: 400 }
      );
    }

    // Find the issue by GitHub issue number
    const issue = await prisma.issue.findFirst({
      where: { githubNumber: issueNumber },
      include: {
        atomicSteps: {
          orderBy: { order: "asc" }
        }
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: `Issue #${issueNumber} not found` },
        { status: 404 }
      );
    }

    // Find the step by order (stepNumber is 1-indexed)
    const step = issue.atomicSteps.find((s) => s.order === stepNumber);
    if (!step) {
      return NextResponse.json(
        { error: `Step #${stepNumber} not found for issue #${issueNumber}. Valid step numbers: 1-${issue.atomicSteps.length}` },
        { status: 404 }
      );
    }

    // Update step status
    const stepStatus = status === "completed" ? "COMPLETED" : "BLOCKED";
    await prisma.atomicStep.update({
      where: { id: step.id },
      data: {
        status: stepStatus,
        completedAt: status === "completed" ? new Date() : null,
        verifiedVia: "mcp",
        metadata: details ? JSON.stringify({ details }) : null,
      },
    });

    // Recalculate progress
    const allSteps = await prisma.atomicStep.findMany({
      where: { issueId: issue.id },
    });
    const completed = allSteps.filter((s) => s.status === "COMPLETED").length;
    const progress = Math.round((completed / allSteps.length) * 100);

    // Update issue
    await prisma.issue.update({
      where: { id: issue.id },
      data: {
        progressPercent: progress,
        status: progress === 100 ? "DONE" : progress > 0 ? "IN_PROGRESS" : "TODO",
      },
    });

    return NextResponse.json({
      success: true,
      progress,
      message: `Step #${stepNumber} marked as ${status}`,
    });
  } catch (error) {
    console.error("Error reporting step:", error);
    return NextResponse.json({ error: "Failed to report step" }, { status: 500 });
  }
}
