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
import { parseApiResponseForStep } from "@/lib/cerebras";

type CheckAction = "api_check" | "manual_confirm" | "mcp_info";

// Helper to recalculate progress and update issue
async function recalculateProgress(issueId: string) {
  const allSteps = await prisma.atomicStep.findMany({
    where: { issueId },
  });

  const completed = allSteps.filter((s) => s.status === "COMPLETED").length;
  const progress = Math.round((completed / allSteps.length) * 100);

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  let issueStatus = issue?.status || "TODO";
  if (progress === 100) {
    issueStatus = "DONE";
  } else if (progress > 0) {
    issueStatus = "IN_PROGRESS";
  }

  await prisma.issue.update({
    where: { id: issueId },
    data: {
      progressPercent: progress,
      status: issueStatus,
    },
  });

  return progress;
}

// POST /api/issues/[issueId]/steps/[stepId]/check
// Body: { action: "api_check" | "manual_confirm" | "mcp_info" }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string; stepId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { issueId, stepId } = await params;
    const body = await request.json();
    const { action } = body as { action: CheckAction };

    if (!action || !["api_check", "manual_confirm", "mcp_info"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get step with issue and project
    const step = await prisma.atomicStep.findFirst({
      where: {
        id: stepId,
        issueId,
        issue: { project: { userId: session.user.id } },
      },
      include: { issue: { include: { project: true } } },
    });

    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    const { checkMethod } = step;

    // Validate action is allowed for this check method
    switch (action) {
      case "manual_confirm":
        if (!["MANUAL", "MCP_OR_MANUAL"].includes(checkMethod)) {
          return NextResponse.json(
            { error: "Manual confirmation not allowed for this step" },
            { status: 400 }
          );
        }
        break;
      case "api_check":
        if (!["API", "MCP_OR_API"].includes(checkMethod)) {
          return NextResponse.json(
            { error: "API check not available for this step" },
            { status: 400 }
          );
        }
        break;
      case "mcp_info":
        if (!["MCP", "MCP_OR_MANUAL", "MCP_OR_API"].includes(checkMethod)) {
          return NextResponse.json(
            { error: "MCP check not available for this step" },
            { status: 400 }
          );
        }
        break;
    }

    // Handle each action
    switch (action) {
      case "manual_confirm": {
        // Mark as complete with manual verification
        await prisma.atomicStep.update({
          where: { id: stepId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            verifiedVia: "manual",
          },
        });

        const progress = await recalculateProgress(issueId);

        return NextResponse.json({
          completed: true,
          message: "Step manually confirmed as complete",
          progress,
        });
      }

      case "mcp_info": {
        // Return MCP endpoint information
        return NextResponse.json({
          completed: false,
          message: "Run this step in your IDE using the DevFlow extension",
          mcpEndpoint: "/api/mcp/report-step",
          payload: {
            issueNumber: step.issue.githubNumber,
            stepType: step.type,
            status: "completed",
          },
        });
      }

      case "api_check": {
        // Get access token for GitHub API
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
        const { githubRepoOwner: owner, githubRepoName: repo } = step.issue.project;

        let apiResponse: unknown = {};
        let apiContext = "";

        // Fetch relevant GitHub data based on step type
        switch (step.type) {
          case "CREATE_PR": {
            const prs = await fetchRepoPRs(octokit, owner, repo);
            const linkedPR = findLinkedPR(step.issue.githubNumber, prs);
            apiResponse = { linkedPR, searchedFor: step.issue.githubNumber, totalPRs: prs.length };
            apiContext = "Pull Request search results";

            if (linkedPR) {
              // Update issue with PR info
              await prisma.issue.update({
                where: { id: issueId },
                data: {
                  linkedPrNumber: linkedPR.number,
                  linkedPrUrl: linkedPR.html_url,
                  linkedPrState: linkedPR.merged ? "merged" : linkedPR.state,
                },
              });
            }
            break;
          }

          case "REQUEST_REVIEW": {
            if (step.issue.linkedPrNumber) {
              const reviews = await fetchPRReviews(octokit, owner, repo, step.issue.linkedPrNumber);
              apiResponse = { reviews, prNumber: step.issue.linkedPrNumber };
              apiContext = "PR review requests";
            } else {
              apiResponse = { error: "No linked PR found" };
              apiContext = "PR lookup";
            }
            break;
          }

          case "GET_APPROVAL": {
            if (step.issue.linkedPrNumber) {
              const reviews = await fetchPRReviews(octokit, owner, repo, step.issue.linkedPrNumber);
              const approved = reviews.filter((r) => r.state === "APPROVED");
              apiResponse = { reviews, approved, prNumber: step.issue.linkedPrNumber };
              apiContext = "PR approval status";
            } else {
              apiResponse = { error: "No linked PR found" };
              apiContext = "PR lookup";
            }
            break;
          }

          case "MERGE": {
            if (step.issue.linkedPrNumber) {
              const merged = await checkPRMerged(octokit, owner, repo, step.issue.linkedPrNumber);
              apiResponse = { merged, prNumber: step.issue.linkedPrNumber };
              apiContext = "PR merge status";

              if (merged) {
                await prisma.issue.update({
                  where: { id: issueId },
                  data: { linkedPrState: "merged" },
                });
              }
            } else {
              apiResponse = { error: "No linked PR found" };
              apiContext = "PR lookup";
            }
            break;
          }

          case "DEPLOY": {
            const runs = await fetchWorkflowRuns(octokit, owner, repo);
            const latestRun = runs[0];
            apiResponse = { latestRun, totalRuns: runs.length };
            apiContext = "GitHub Actions workflow runs";

            if (latestRun) {
              await prisma.issue.update({
                where: { id: issueId },
                data: { pipelineStatus: latestRun.conclusion || latestRun.status },
              });
            }
            break;
          }

          case "CLOSE_ISSUE": {
            try {
              const { data: ghIssue } = await octokit.issues.get({
                owner,
                repo,
                issue_number: step.issue.githubNumber,
              });
              apiResponse = { issueState: ghIssue.state, issueNumber: step.issue.githubNumber };
              apiContext = "GitHub issue status";
            } catch {
              apiResponse = { error: "Could not fetch issue" };
              apiContext = "GitHub issue lookup";
            }
            break;
          }

          case "CREATE_BRANCH": {
            // For CREATE_BRANCH, we'd need to check if branch exists
            // This is a simplified check - in production you'd check for the branch
            apiResponse = { note: "Branch creation is typically verified via MCP/IDE" };
            apiContext = "Branch creation check";
            break;
          }

          default:
            apiResponse = { note: "No automated check available for this step type" };
            apiContext = "Step verification";
        }

        // Use Cerebras to parse the API response
        const parseResult = await parseApiResponseForStep(
          step.name,
          step.description || "",
          step.type,
          apiResponse,
          apiContext
        );

        // If complete, update the step
        if (parseResult.isComplete) {
          await prisma.atomicStep.update({
            where: { id: stepId },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              verifiedVia: "github_api",
              metadata: JSON.stringify(apiResponse),
            },
          });

          const progress = await recalculateProgress(issueId);

          return NextResponse.json({
            completed: true,
            message: parseResult.explanation,
            confidence: parseResult.confidence,
            progress,
          });
        }

        return NextResponse.json({
          completed: false,
          message: parseResult.explanation,
          confidence: parseResult.confidence,
        });
      }
    }
  } catch (error) {
    console.error("Error handling check action:", error);
    return NextResponse.json({ error: "Failed to process check action" }, { status: 500 });
  }
}
