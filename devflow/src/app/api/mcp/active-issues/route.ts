import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mcp/active-issues - Get all in-progress issues
export async function GET() {
  try {
    const issues = await prisma.issue.findMany({
      where: {
        status: {
          in: ["TODO", "IN_PROGRESS", "IN_REVIEW"],
        },
      },
      include: {
        atomicSteps: {
          orderBy: { order: "asc" },
        },
        project: {
          select: {
            name: true,
            githubRepoOwner: true,
            githubRepoName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      issues: issues.map((issue) => ({
        id: issue.id,
        number: issue.githubNumber,
        title: issue.title,
        progress: issue.progressPercent,
        status: issue.status,
        project: issue.project.name,
        stepsCompleted: issue.atomicSteps.filter((s) => s.status === "COMPLETED").length,
        stepsTotal: issue.atomicSteps.length,
      })),
    });
  } catch (error) {
    console.error("Error fetching active issues:", error);
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}
