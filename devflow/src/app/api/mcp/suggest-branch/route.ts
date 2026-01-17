import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Utility to create a URL-safe slug from title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, 50); // Limit length
}

// GET /api/mcp/suggest-branch?issueNumber=123 - Get suggested branch name for an issue
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
        project: {
          select: {
            githubRepoOwner: true,
            githubRepoName: true,
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: `Issue #${issueNumber} not found` },
        { status: 404 }
      );
    }

    const slug = slugify(issue.title);
    const branchName = `feature/${issue.githubNumber}-${slug}`;

    return NextResponse.json({
      issueNumber: issue.githubNumber,
      issueTitle: issue.title,
      suggestedBranch: branchName,
      baseBranch: "main",
      repo: {
        owner: issue.project.githubRepoOwner,
        name: issue.project.githubRepoName,
      },
    });
  } catch (error) {
    console.error("Error suggesting branch:", error);
    return NextResponse.json(
      { error: "Failed to suggest branch name" },
      { status: 500 }
    );
  }
}
