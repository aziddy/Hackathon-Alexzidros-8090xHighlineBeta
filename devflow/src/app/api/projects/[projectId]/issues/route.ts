import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[projectId]/issues - Get all issues for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const issues = await prisma.issue.findMany({
      where: { projectId },
      include: { atomicSteps: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });

    // Transform for frontend
    const transformed = issues.map((issue) => ({
      ...issue,
      labels: issue.labels ? JSON.parse(issue.labels) : [],
      assignees: issue.assignees ? JSON.parse(issue.assignees) : [],
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}
