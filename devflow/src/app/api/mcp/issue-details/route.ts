import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mcp/issue-details?issueNumber=123 - Get detailed info for an issue
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
    });

    if (!issue) {
      return NextResponse.json(
        { error: `Issue #${issueNumber} not found` },
        { status: 404 }
      );
    }

    // Parse labels from JSON string
    let labels: string[] = [];
    if (issue.labels) {
      try {
        labels = JSON.parse(issue.labels);
      } catch {
        labels = [];
      }
    }

    return NextResponse.json({
      issueNumber: issue.githubNumber,
      title: issue.title,
      progress: issue.progressPercent,
      description: issue.body || null,
      labels,
    });
  } catch (error) {
    console.error("Error fetching issue details:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue details" },
      { status: 500 }
    );
  }
}
