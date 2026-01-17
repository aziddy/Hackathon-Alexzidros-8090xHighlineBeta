import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects - List all projects for user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        issues: {
          include: { atomicSteps: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, githubRepoOwner, githubRepoName } = body;

    if (!githubRepoOwner || !githubRepoName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if project already exists
    const existing = await prisma.project.findUnique({
      where: {
        userId_githubRepoOwner_githubRepoName: {
          userId: session.user.id,
          githubRepoOwner,
          githubRepoName,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Project already exists" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: name || `${githubRepoOwner}/${githubRepoName}`,
        githubRepoOwner,
        githubRepoName,
        userId: session.user.id,
      },
      include: {
        issues: {
          include: { atomicSteps: true },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
