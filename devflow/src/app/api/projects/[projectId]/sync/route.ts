import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOctokit, fetchRepoIssues, fetchRepoPRs, findLinkedPR } from "@/lib/github";

// POST /api/projects/[projectId]/sync - Sync issues from GitHub
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Get project and verify ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get user's access token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "github",
      },
    });

    if (!account?.access_token) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
    }

    const octokit = createOctokit(account.access_token);

    // Fetch issues and PRs from GitHub
    const [githubIssues, githubPRs] = await Promise.all([
      fetchRepoIssues(octokit, project.githubRepoOwner, project.githubRepoName),
      fetchRepoPRs(octokit, project.githubRepoOwner, project.githubRepoName),
    ]);

    // Upsert issues
    for (const ghIssue of githubIssues) {
      const linkedPR = findLinkedPR(ghIssue.number, githubPRs);

      // Determine status based on issue state
      let status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" = "TODO";
      if (ghIssue.state === "closed") {
        status = "DONE";
      } else if (linkedPR) {
        if (linkedPR.merged) {
          status = "DONE";
        } else if (linkedPR.state === "open") {
          status = "IN_REVIEW";
        }
      } else if (ghIssue.assignees && ghIssue.assignees.length > 0) {
        status = "IN_PROGRESS";
      }

      await prisma.issue.upsert({
        where: {
          projectId_githubIssueId: {
            projectId: project.id,
            githubIssueId: ghIssue.node_id,
          },
        },
        update: {
          title: ghIssue.title,
          body: ghIssue.body,
          githubUrl: ghIssue.html_url,
          status,
          labels: JSON.stringify(ghIssue.labels.map((l) => l.name)),
          assignees: JSON.stringify(ghIssue.assignees?.map((a) => a.login) || []),
          linkedPrNumber: linkedPR?.number,
          linkedPrUrl: linkedPR?.html_url,
          linkedPrState: linkedPR ? (linkedPR.merged ? "merged" : linkedPR.state) : null,
        },
        create: {
          projectId: project.id,
          title: ghIssue.title,
          body: ghIssue.body,
          githubIssueId: ghIssue.node_id,
          githubNumber: ghIssue.number,
          githubUrl: ghIssue.html_url,
          status,
          labels: JSON.stringify(ghIssue.labels.map((l) => l.name)),
          assignees: JSON.stringify(ghIssue.assignees?.map((a) => a.login) || []),
          linkedPrNumber: linkedPR?.number,
          linkedPrUrl: linkedPR?.html_url,
          linkedPrState: linkedPR ? (linkedPR.merged ? "merged" : linkedPR.state) : null,
        },
      });
    }

    // Update project lastSyncedAt
    await prisma.project.update({
      where: { id: project.id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({ success: true, synced: githubIssues.length });
  } catch (error) {
    console.error("Error syncing project:", error);
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}
