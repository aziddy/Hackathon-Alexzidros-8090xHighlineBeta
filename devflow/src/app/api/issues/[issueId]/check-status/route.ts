import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createOctokit,
  fetchRepoPRs,
  findLinkedPR,
  checkPRMerged,
  fetchPRReviews,
  fetchWorkflowRuns,
} from "@/lib/github";

// POST /api/issues/[issueId]/check-status - Check step completion via GitHub API
export async function POST(
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
    const { stepId } = body;

    if (!stepId) {
      return NextResponse.json({ error: "stepId required" }, { status: 400 });
    }

    // Get issue with project and step
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        project: { userId: session.user.id },
      },
      include: {
        project: true,
        atomicSteps: true,
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const step = issue.atomicSteps.find((s) => s.id === stepId);
    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    // Get access token
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
    const { githubRepoOwner: owner, githubRepoName: repo } = issue.project;

    let completed = false;
    let message = "";
    let metadata: Record<string, unknown> = {};

    switch (step.type) {
      case "CREATE_PR": {
        const prs = await fetchRepoPRs(octokit, owner, repo);
        const linkedPR = findLinkedPR(issue.githubNumber, prs);
        if (linkedPR) {
          completed = true;
          message = `PR #${linkedPR.number} found`;
          metadata = { prNumber: linkedPR.number, prUrl: linkedPR.html_url };

          // Update issue with PR info
          await prisma.issue.update({
            where: { id: issueId },
            data: {
              linkedPrNumber: linkedPR.number,
              linkedPrUrl: linkedPR.html_url,
              linkedPrState: linkedPR.merged ? "merged" : linkedPR.state,
            },
          });
        } else {
          message = "No PR found referencing this issue";
        }
        break;
      }

      case "REQUEST_REVIEW": {
        if (issue.linkedPrNumber) {
          const reviews = await fetchPRReviews(octokit, owner, repo, issue.linkedPrNumber);
          if (reviews.length > 0) {
            completed = true;
            message = `${reviews.length} reviewer(s) assigned`;
            metadata = { reviewCount: reviews.length };
          } else {
            message = "No reviewers found on the PR";
          }
        } else {
          message = "No linked PR found";
        }
        break;
      }

      case "GET_APPROVAL": {
        if (issue.linkedPrNumber) {
          const reviews = await fetchPRReviews(octokit, owner, repo, issue.linkedPrNumber);
          const approved = reviews.filter((r) => r.state === "APPROVED");
          if (approved.length > 0) {
            completed = true;
            message = `${approved.length} approval(s) received`;
            metadata = { approvals: approved.length };
          } else {
            message = "No approvals yet";
          }
        } else {
          message = "No linked PR found";
        }
        break;
      }

      case "MERGE": {
        if (issue.linkedPrNumber) {
          const merged = await checkPRMerged(octokit, owner, repo, issue.linkedPrNumber);
          if (merged) {
            completed = true;
            message = "PR has been merged";

            await prisma.issue.update({
              where: { id: issueId },
              data: { linkedPrState: "merged" },
            });
          } else {
            message = "PR not yet merged";
          }
        } else {
          message = "No linked PR found";
        }
        break;
      }

      case "DEPLOY": {
        const runs = await fetchWorkflowRuns(octokit, owner, repo);
        if (runs.length > 0) {
          const latestRun = runs[0];
          if (latestRun.conclusion === "success") {
            completed = true;
            message = "Latest workflow succeeded";
            metadata = { runId: latestRun.id, conclusion: latestRun.conclusion };
          } else {
            message = `Latest workflow: ${latestRun.conclusion || latestRun.status}`;
          }

          await prisma.issue.update({
            where: { id: issueId },
            data: { pipelineStatus: latestRun.conclusion || latestRun.status },
          });
        } else {
          message = "No workflow runs found";
        }
        break;
      }

      case "CLOSE_ISSUE": {
        // Check if GitHub issue is closed
        try {
          const { data: ghIssue } = await octokit.issues.get({
            owner,
            repo,
            issue_number: issue.githubNumber,
          });
          if (ghIssue.state === "closed") {
            completed = true;
            message = "Issue is closed on GitHub";
          } else {
            message = "Issue is still open on GitHub";
          }
        } catch {
          message = "Could not check issue status";
        }
        break;
      }

      default:
        message = "Manual verification required for this step type";
    }

    // Update step if completed
    if (completed) {
      await prisma.atomicStep.update({
        where: { id: stepId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          verifiedVia: "github_api",
          metadata: JSON.stringify(metadata),
        },
      });

      // Recalculate progress
      const allSteps = await prisma.atomicStep.findMany({
        where: { issueId },
      });
      const completedCount = allSteps.filter((s) => s.status === "COMPLETED").length;
      const progress = Math.round((completedCount / allSteps.length) * 100);

      await prisma.issue.update({
        where: { id: issueId },
        data: {
          progressPercent: progress,
          status: progress === 100 ? "DONE" : progress > 0 ? "IN_PROGRESS" : "TODO",
        },
      });
    }

    return NextResponse.json({ completed, message, metadata });
  } catch (error) {
    console.error("Error checking status:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
