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
import {
  createBranch,
  getLinkedBranches,
  listBranches,
} from "@/lib/github-actions";
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

        // Log the start of API check with context
        console.log("🔍 [GitHub API Check] Starting API verification:", {
          stepId,
          stepType: step.type,
          stepName: step.name,
          issueId,
          issueNumber: step.issue.githubNumber,
          repoContext: { owner, repo },
          linkedPrNumber: step.issue.linkedPrNumber,
          checkMethod: step.checkMethod,
        });

        // Fetch relevant GitHub data based on step type
        switch (step.type) {
          case "CREATE_PR": {
            console.log("📝 [GitHub API Check] Fetching PRs for CREATE_PR step:", {
              stepType: "CREATE_PR",
              owner,
              repo,
              searchingForIssue: step.issue.githubNumber,
            });

            const prs = await fetchRepoPRs(octokit, owner, repo);

            console.log("✅ [GitHub API Check] Received PR data:", {
              stepType: "CREATE_PR",
              totalPRs: prs.length,
              searchedFor: step.issue.githubNumber,
            });

            const linkedPR = findLinkedPR(step.issue.githubNumber, prs);

            console.log(`${linkedPR ? "✅" : "⚠️"} [GitHub API Check] PR search result:`, {
              stepType: "CREATE_PR",
              linkedPRFound: !!linkedPR,
              linkedPRNumber: linkedPR?.number,
              linkedPRTitle: linkedPR?.title,
              linkedPRState: linkedPR?.state,
              linkedPRMerged: linkedPR?.merged,
            });

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
              console.log("👀 [GitHub API Check] Fetching PR reviews for REQUEST_REVIEW step:", {
                stepType: "REQUEST_REVIEW",
                owner,
                repo,
                prNumber: step.issue.linkedPrNumber,
              });

              const reviews = await fetchPRReviews(octokit, owner, repo, step.issue.linkedPrNumber);

              console.log("✅ [GitHub API Check] Received PR review data:", {
                stepType: "REQUEST_REVIEW",
                prNumber: step.issue.linkedPrNumber,
                totalReviews: reviews.length,
                reviewStates: reviews.map(r => ({ user: r.user?.login, state: r.state })),
              });

              apiResponse = { reviews, prNumber: step.issue.linkedPrNumber };
              apiContext = "PR review requests";
            } else {
              console.log("⚠️ [GitHub API Check] No linked PR for REQUEST_REVIEW step:", {
                stepType: "REQUEST_REVIEW",
                issueId,
                issueNumber: step.issue.githubNumber,
              });
              apiResponse = { error: "No linked PR found" };
              apiContext = "PR lookup";
            }
            break;
          }

          case "GET_APPROVAL": {
            if (step.issue.linkedPrNumber) {
              console.log("✅ [GitHub API Check] Fetching PR approvals for GET_APPROVAL step:", {
                stepType: "GET_APPROVAL",
                owner,
                repo,
                prNumber: step.issue.linkedPrNumber,
              });

              const reviews = await fetchPRReviews(octokit, owner, repo, step.issue.linkedPrNumber);
              const approved = reviews.filter((r) => r.state === "APPROVED");

              console.log(`${approved.length > 0 ? "✅" : "⚠️"} [GitHub API Check] PR approval status:`, {
                stepType: "GET_APPROVAL",
                prNumber: step.issue.linkedPrNumber,
                totalReviews: reviews.length,
                approvedReviews: approved.length,
                approvers: approved.map(r => r.user?.login),
                pendingReviews: reviews.filter(r => r.state === "PENDING").length,
              });

              apiResponse = { reviews, approved, prNumber: step.issue.linkedPrNumber };
              apiContext = "PR approval status";
            } else {
              console.log("⚠️ [GitHub API Check] No linked PR for GET_APPROVAL step:", {
                stepType: "GET_APPROVAL",
                issueId,
                issueNumber: step.issue.githubNumber,
              });
              apiResponse = { error: "No linked PR found" };
              apiContext = "PR lookup";
            }
            break;
          }

          case "MERGE": {
            if (step.issue.linkedPrNumber) {
              console.log("🔀 [GitHub API Check] Checking PR merge status for MERGE step:", {
                stepType: "MERGE",
                owner,
                repo,
                prNumber: step.issue.linkedPrNumber,
              });

              const merged = await checkPRMerged(octokit, owner, repo, step.issue.linkedPrNumber);

              console.log(`${merged ? "✅" : "⚠️"} [GitHub API Check] PR merge status:`, {
                stepType: "MERGE",
                prNumber: step.issue.linkedPrNumber,
                merged,
              });

              apiResponse = { merged, prNumber: step.issue.linkedPrNumber };
              apiContext = "PR merge status";

              if (merged) {
                console.log("📝 [GitHub API Check] Updating issue with merged PR state:", {
                  issueId,
                  prNumber: step.issue.linkedPrNumber,
                });
                await prisma.issue.update({
                  where: { id: issueId },
                  data: { linkedPrState: "merged" },
                });
              }
            } else {
              console.log("⚠️ [GitHub API Check] No linked PR for MERGE step:", {
                stepType: "MERGE",
                issueId,
                issueNumber: step.issue.githubNumber,
              });
              apiResponse = { error: "No linked PR found" };
              apiContext = "PR lookup";
            }
            break;
          }

          case "DEPLOY": {
            console.log("🚀 [GitHub API Check] Fetching workflow runs for DEPLOY step:", {
              stepType: "DEPLOY",
              owner,
              repo,
              branch: "main",
            });

            const runs = await fetchWorkflowRuns(octokit, owner, repo);
            const latestRun = runs[0];

            console.log(`${latestRun ? "✅" : "⚠️"} [GitHub API Check] Workflow run status:`, {
              stepType: "DEPLOY",
              totalRuns: runs.length,
              latestRun: latestRun ? {
                id: latestRun.id,
                name: latestRun.name,
                status: latestRun.status,
                conclusion: latestRun.conclusion,
                branch: latestRun.head_branch,
                url: latestRun.html_url,
              } : null,
            });

            apiResponse = { latestRun, totalRuns: runs.length };
            apiContext = "GitHub Actions workflow runs";

            if (latestRun) {
              console.log("📝 [GitHub API Check] Updating issue with workflow status:", {
                issueId,
                pipelineStatus: latestRun.conclusion || latestRun.status,
              });
              await prisma.issue.update({
                where: { id: issueId },
                data: { pipelineStatus: latestRun.conclusion || latestRun.status },
              });
            }
            break;
          }

          case "CLOSE_ISSUE": {
            console.log("🔒 [GitHub API Check] Fetching issue status for CLOSE_ISSUE step:", {
              stepType: "CLOSE_ISSUE",
              owner,
              repo,
              issueNumber: step.issue.githubNumber,
            });

            try {
              const { data: ghIssue } = await octokit.issues.get({
                owner,
                repo,
                issue_number: step.issue.githubNumber,
              });

              console.log(`${ghIssue.state === "closed" ? "✅" : "⚠️"} [GitHub API Check] Issue state:`, {
                stepType: "CLOSE_ISSUE",
                issueNumber: step.issue.githubNumber,
                state: ghIssue.state,
                closedAt: ghIssue.closed_at,
                closedBy: ghIssue.closed_by?.login,
              });

              apiResponse = { issueState: ghIssue.state, issueNumber: step.issue.githubNumber };
              apiContext = "GitHub issue status";
            } catch (error) {
              console.error("❌ [GitHub API Check] Failed to fetch issue:", {
                stepType: "CLOSE_ISSUE",
                owner,
                repo,
                issueNumber: step.issue.githubNumber,
                error: error instanceof Error ? error.message : String(error),
              });
              apiResponse = { error: "Could not fetch issue" };
              apiContext = "GitHub issue lookup";
            }
            break;
          }

          case "CREATE_BRANCH": {
            try {
              // Generate branch name using existing pattern
              const slugify = (text: string): string => {
                return text
                  .toLowerCase()
                  .trim()
                  .replace(/[^\w\s-]/g, "")
                  .replace(/\s+/g, "-")
                  .replace(/-+/g, "-")
                  .substring(0, 50);
              };

              const slug = slugify(step.issue.title);
              const branchName = `feature/${step.issue.githubNumber}-${slug}`;

              console.log("🌿 [GitHub API Check] Starting CREATE_BRANCH verification:", {
                stepType: "CREATE_BRANCH",
                owner,
                repo,
                issueNumber: step.issue.githubNumber,
                proposedBranchName: branchName,
              });

              // Check linked branches
              console.log("🔍 [GitHub API Check] Checking for linked branches:", {
                stepType: "CREATE_BRANCH",
                owner,
                repo,
                issueNumber: step.issue.githubNumber,
              });

              const linkedBranchesResult = await getLinkedBranches(
                octokit,
                { owner, repo },
                { issueNumber: step.issue.githubNumber }
              );

              console.log("✅ [GitHub API Check] Linked branches result:", {
                stepType: "CREATE_BRANCH",
                success: linkedBranchesResult.success,
                branches: linkedBranchesResult.data?.branches || [],
                message: linkedBranchesResult.message,
              });

              // List all branches
              console.log("🔍 [GitHub API Check] Listing repository branches:", {
                stepType: "CREATE_BRANCH",
                owner,
                repo,
                limit: 100,
              });

              const allBranchesResult = await listBranches(
                octokit,
                { owner, repo },
                { limit: 100 }
              );

              console.log("✅ [GitHub API Check] Repository branches result:", {
                stepType: "CREATE_BRANCH",
                success: allBranchesResult.success,
                totalBranches: Array.isArray(allBranchesResult.data?.branches)
                  ? allBranchesResult.data.branches.length
                  : 0,
                branchExists: allBranchesResult.success &&
                  Array.isArray(allBranchesResult.data?.branches) &&
                  allBranchesResult.data.branches.some((b: { name: string }) => b.name === branchName),
              });

              let branchExists = false;
              let isLinked = false;

              // Check if our branch name exists
              if (allBranchesResult.success && allBranchesResult.data?.branches && Array.isArray(allBranchesResult.data.branches)) {
                branchExists = allBranchesResult.data.branches.some(
                  (b: { name: string }) => b.name === branchName
                );
              }

              // Check if any branch is already linked
              if (linkedBranchesResult.success && linkedBranchesResult.data?.branches) {
                const linkedBranches = linkedBranchesResult.data.branches as string[];
                isLinked = linkedBranches.length > 0;

                if (isLinked) {
                  const linkedBranchName = linkedBranches[0];
                  console.log("✅ [GitHub API Check] Branch already linked:", {
                    stepType: "CREATE_BRANCH",
                    linkedBranchName,
                    issueNumber: step.issue.githubNumber,
                  });
                  apiResponse = {
                    branchName: linkedBranchName,
                    alreadyLinked: true,
                    message: `Branch '${linkedBranchName}' is already linked to issue #${step.issue.githubNumber}`
                  };
                  apiContext = "Branch already linked to issue";
                }
              }

              // Create branch if it doesn't exist
              if (!branchExists && !isLinked) {
                console.log("🔨 [GitHub API Check] Creating new branch:", {
                  stepType: "CREATE_BRANCH",
                  branchName,
                  fromBranch: "main",
                  issueNumber: step.issue.githubNumber,
                  owner,
                  repo,
                });

                const createResult = await createBranch(
                  octokit,
                  { owner, repo },
                  {
                    branchName,
                    fromBranch: "main",
                    issueNumber: step.issue.githubNumber
                  }
                );

                console.log(`${createResult.success ? "✅" : "❌"} [GitHub API Check] Branch creation result:`, {
                  stepType: "CREATE_BRANCH",
                  success: createResult.success,
                  message: createResult.message,
                  branchName,
                  linked: createResult.data?.linked || false,
                });

                if (!createResult.success) {
                  console.error("❌ [GitHub API Check] Branch creation failed:", {
                    stepType: "CREATE_BRANCH",
                    branchName,
                    error: createResult.error,
                    message: createResult.message,
                  });
                  // Branch creation failed - fail the entire check
                  return NextResponse.json({
                    completed: false,
                    error: true,
                    message: `Failed to create branch: ${createResult.message}`,
                  }, { status: 400 });
                }

                // Store branch metadata in Issue
                const branchMetadata = {
                  branch: {
                    name: branchName,
                    createdAt: new Date().toISOString(),
                    linkedAt: new Date().toISOString(),
                    baseBranch: "main"
                  }
                };

                console.log("📝 [GitHub API Check] Storing branch metadata:", {
                  stepType: "CREATE_BRANCH",
                  issueId,
                  branchName,
                });

                await prisma.issue.update({
                  where: { id: issueId },
                  data: { metadata: JSON.stringify(branchMetadata) }
                });

                apiResponse = {
                  branchName,
                  created: true,
                  linked: true,
                  issueNumber: step.issue.githubNumber
                };
                apiContext = "Branch created and linked to issue";

              } else if (branchExists && !isLinked) {
                console.log("⚠️ [GitHub API Check] Branch exists but not linked:", {
                  stepType: "CREATE_BRANCH",
                  branchName,
                  issueNumber: step.issue.githubNumber,
                });

                // Branch exists but not linked - track in metadata
                const branchMetadata = {
                  branch: {
                    name: branchName,
                    createdAt: new Date().toISOString(),
                    baseBranch: "main",
                    note: "Branch existed, tracked locally but not linked in GitHub"
                  }
                };

                await prisma.issue.update({
                  where: { id: issueId },
                  data: { metadata: JSON.stringify(branchMetadata) }
                });

                apiResponse = {
                  branchName,
                  existedButNotLinked: true,
                  message: `Branch '${branchName}' exists but cannot be linked via API.`
                };
                apiContext = "Existing branch tracked in metadata";
              }

            } catch (error) {
              console.error("❌ [GitHub API Check] CREATE_BRANCH error:", {
                stepType: "CREATE_BRANCH",
                stepId,
                issueId,
                owner,
                repo,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              });
              return NextResponse.json({
                completed: false,
                error: true,
                message: `Branch creation failed: ${error instanceof Error ? error.message : String(error)}`,
              }, { status: 500 });
            }
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

        // Log the Cerebras parsing result
        console.log(`${parseResult.isComplete ? "✅" : "⚠️"} [GitHub API Check] Cerebras parsing result:`, {
          stepId,
          stepType: step.type,
          isComplete: parseResult.isComplete,
          confidence: parseResult.confidence,
          explanation: parseResult.explanation,
          apiContext,
        });

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

          console.log("✅ [GitHub API Check] Step marked as completed:", {
            stepId,
            stepType: step.type,
            issueId,
            progress,
            verifiedVia: "github_api",
          });

          return NextResponse.json({
            completed: true,
            message: parseResult.explanation,
            confidence: parseResult.confidence,
            progress,
          });
        }

        console.log("⚠️ [GitHub API Check] Step verification incomplete:", {
          stepId,
          stepType: step.type,
          explanation: parseResult.explanation,
          confidence: parseResult.confidence,
        });

        return NextResponse.json({
          completed: false,
          message: parseResult.explanation,
          confidence: parseResult.confidence,
        });
      }
    }
  } catch (error) {
    console.error("❌ [GitHub API Check] Request processing error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Failed to process check action" }, { status: 500 });
  }
}
