import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/mcp/report-step - Report step completion from MCP/IDE
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueNumber, stepType, status, details } = body;

    if (!issueNumber || !stepType || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the issue by GitHub issue number
    const issue = await prisma.issue.findFirst({
      where: { githubNumber: issueNumber },
      include: { atomicSteps: true },
    });

    if (!issue) {
      return NextResponse.json(
        { error: `Issue #${issueNumber} not found` },
        { status: 404 }
      );
    }

    // Find the step by type
    const step = issue.atomicSteps.find((s) => s.type === stepType);
    if (!step) {
      return NextResponse.json(
        { error: `Step type ${stepType} not found for issue #${issueNumber}` },
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
      message: `Step ${stepType} marked as ${status}`,
    });
  } catch (error) {
    console.error("Error reporting step:", error);
    return NextResponse.json({ error: "Failed to report step" }, { status: 500 });
  }
}
