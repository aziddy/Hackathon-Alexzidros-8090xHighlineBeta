import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mcp/issue-steps?issueNumber=123 - Get steps for an issue
export async function GET(request: NextRequest) {
  try {
    const issueNumber = request.nextUrl.searchParams.get("issueNumber");

    if (!issueNumber) {
      return NextResponse.json(
        { error: "issueNumber parameter required" },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findFirst({
      where: { githubNumber: parseInt(issueNumber) },
      include: {
        atomicSteps: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: `Issue #${issueNumber} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: issue.id,
      number: issue.githubNumber,
      title: issue.title,
      progress: issue.progressPercent,
      status: issue.status,
      steps: issue.atomicSteps.map((step) => ({
        id: step.id,
        name: step.name,
        type: step.type,
        status: step.status,
        order: step.order,
        completedAt: step.completedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching steps:", error);
    return NextResponse.json({ error: "Failed to fetch steps" }, { status: 500 });
  }
}
