import { Octokit } from "@octokit/rest";
import { GitHubActionType, GitHubActionResult } from "@/types";

// Actions that require user confirmation before execution
export const CONFIRMATION_REQUIRED: GitHubActionType[] = [
  "CREATE_ISSUE",
  "ADD_COMMENT",
  "CREATE_BRANCH",
  "CREATE_PR",
  "LINK_BRANCH",
];

// Actions that can be executed immediately (read-only)
export const READ_ONLY_ACTIONS: GitHubActionType[] = [
  "LIST_REPOS",
  "LIST_ISSUES",
  "LIST_PRS",
  "CHECK_WORKFLOW",
  "GET_LINKED_BRANCHES",
  "LIST_BRANCHES",
];

export interface RepoContext {
  owner: string;
  repo: string;
}

// Parse GitHub API errors into user-friendly messages
function parseGitHubError(error: unknown, action: string): string {
  const errorStr = String(error);

  // Handle Octokit/GitHub API errors
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as { status: number; message?: string; response?: { data?: { message?: string } } };

    // Extract error message from response
    const message = apiError.response?.data?.message || apiError.message || errorStr;

    // Common GitHub API error patterns
    if (apiError.status === 404) {
      if (message.includes('Branch')) return `Branch not found. Please check the branch name.`;
      if (message.includes('Repository')) return `Repository not found or you don't have access.`;
      if (message.includes('Issue')) return `Issue not found.`;
      return `Resource not found: ${message}`;
    }

    if (apiError.status === 422) {
      if (message.includes('already exists')) {
        if (action.includes('PR') || action.includes('pull request')) {
          return `A pull request already exists for this branch.`;
        }
        if (action.includes('branch')) {
          return `Branch already exists. Please choose a different name.`;
        }
        return `Resource already exists: ${message}`;
      }
      if (message.includes('Validation Failed')) {
        // Try to extract specific field error from validation message
        if (message.includes('"field":"head"')) {
          return `The head branch doesn't exist or is invalid. Make sure the branch exists on GitHub (push it first).`;
        }
        if (message.includes('"field":"base"')) {
          return `The base branch doesn't exist or is invalid.`;
        }
        if (message.includes('"code":"custom"') || message.includes('No commits between')) {
          return `No commits found between the base and head branches. Make sure you have pushed commits to the branch.`;
        }
        return `Validation failed: ${message}`;
      }
      return `Invalid request: ${message}`;
    }

    if (apiError.status === 403) {
      return `Permission denied: You don't have permission to ${action}. ${message}`;
    }

    if (apiError.status === 401) {
      return `Authentication failed: Please reconnect your GitHub account.`;
    }

    // Generic API error
    return `GitHub API error (${apiError.status}): ${message}`;
  }

  // Check for common error patterns in string
  if (errorStr.includes('No commits between')) {
    return `Cannot create pull request: No commits between base and head branches.`;
  }

  if (errorStr.includes('Reference does not exist')) {
    return `Branch or reference does not exist. Please check the branch name.`;
  }

  // Return original error message if no specific pattern matched
  return errorStr;
}

// Create a new GitHub issue
export async function createIssue(
  octokit: Octokit,
  context: RepoContext,
  params: { title: string; body?: string; labels?: string[] }
): Promise<GitHubActionResult> {
  try {
    const { data } = await octokit.issues.create({
      owner: context.owner,
      repo: context.repo,
      title: params.title,
      body: params.body,
      labels: params.labels,
    });
    return {
      success: true,
      message: `Created issue #${data.number}: ${data.title}`,
      data: { issueNumber: data.number, url: data.html_url },
    };
  } catch (error) {
    const errorMessage = parseGitHubError(error, "create issue");
    console.error("[GitHub API] Failed to create issue:", {
      context,
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: errorMessage,
      error: String(error),
    };
  }
}

// Add a comment to an issue or PR
export async function addComment(
  octokit: Octokit,
  context: RepoContext,
  params: { issueNumber: number; body: string }
): Promise<GitHubActionResult> {
  try {
    const { data } = await octokit.issues.createComment({
      owner: context.owner,
      repo: context.repo,
      issue_number: params.issueNumber,
      body: params.body,
    });
    return {
      success: true,
      message: `Added comment to #${params.issueNumber}`,
      data: { commentId: data.id, url: data.html_url },
    };
  } catch (error) {
    const errorMessage = parseGitHubError(error, "add comment");
    console.error("[GitHub API] Failed to add comment:", {
      context,
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: errorMessage,
      error: String(error),
    };
  }
}

// Create a new branch on GitHub (remote) and optionally link it to an issue
// When issueNumber is provided, uses GraphQL createLinkedBranch to create AND link in one operation
export async function createBranch(
  octokit: Octokit,
  context: RepoContext,
  params: { branchName: string; fromBranch?: string; issueNumber?: number }
): Promise<GitHubActionResult> {
  try {
    const baseBranch = params.fromBranch || "main";

    // Get the SHA of the base branch
    const { data: refData } = await octokit.git.getRef({
      owner: context.owner,
      repo: context.repo,
      ref: `heads/${baseBranch}`,
    });

    // If issueNumber is provided, use GraphQL to create AND link the branch
    if (params.issueNumber) {
      // Get repository ID and issue ID
      const repoAndIssueQuery = await octokit.graphql<{
        repository: {
          id: string;
          issue: { id: string };
        };
      }>(`
        query($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            id
            issue(number: $number) {
              id
            }
          }
        }
      `, {
        owner: context.owner,
        repo: context.repo,
        number: params.issueNumber,
      });

      // Create and link the branch via GraphQL mutation
      const result = await octokit.graphql<{
        createLinkedBranch: {
          linkedBranch: { ref: { name: string } } | null;
        };
      }>(`
        mutation($repositoryId: ID!, $issueId: ID!, $oid: GitObjectID!, $name: String!) {
          createLinkedBranch(input: {
            repositoryId: $repositoryId
            issueId: $issueId
            oid: $oid
            name: $name
          }) {
            linkedBranch {
              ref {
                name
              }
            }
          }
        }
      `, {
        repositoryId: repoAndIssueQuery.repository.id,
        issueId: repoAndIssueQuery.repository.issue.id,
        oid: refData.object.sha,
        name: `refs/heads/${params.branchName}`,
      });

      if (result.createLinkedBranch.linkedBranch) {
        return {
          success: true,
          message: `Created branch '${params.branchName}' from '${baseBranch}' and linked to issue #${params.issueNumber}`,
          data: { branchName: params.branchName, baseBranch, issueNumber: params.issueNumber, linked: true },
        };
      } else {
        return {
          success: false,
          message: `Failed to create linked branch. The branch '${params.branchName}' may already exist.`,
          error: "createLinkedBranch returned null",
        };
      }
    }

    // Fallback: Create branch without linking (when no issueNumber provided)
    await octokit.git.createRef({
      owner: context.owner,
      repo: context.repo,
      ref: `refs/heads/${params.branchName}`,
      sha: refData.object.sha,
    });

    return {
      success: true,
      message: `Created branch '${params.branchName}' from '${baseBranch}'`,
      data: { branchName: params.branchName, baseBranch },
    };
  } catch (error) {
    const errorMessage = parseGitHubError(error, "create branch");
    console.error("[GitHub API] Failed to create branch:", {
      context,
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: errorMessage,
      error: String(error),
    };
  }
}

// Create a pull request
export async function createPR(
  octokit: Octokit,
  context: RepoContext,
  params: { title: string; body?: string; head: string; base?: string }
): Promise<GitHubActionResult> {
  try {
    const { data } = await octokit.pulls.create({
      owner: context.owner,
      repo: context.repo,
      title: params.title,
      body: params.body,
      head: params.head,
      base: params.base || "main",
    });
    return {
      success: true,
      message: `Created PR #${data.number}: ${data.title}`,
      data: { prNumber: data.number, url: data.html_url },
    };
  } catch (error) {
    const errorMessage = parseGitHubError(error, "create pull request");
    console.error("[GitHub API] Failed to create pull request:", {
      context,
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: errorMessage,
      error: String(error),
    };
  }
}

// Link a branch to an issue (makes it visible in GitHub's Development section)
// Note: GitHub's createLinkedBranch mutation only works for NEW branches.
// For existing branches, we need to check if already linked, and if not,
// the only option is to use CREATE_BRANCH + LINK in a single operation.
export async function linkBranch(
  octokit: Octokit,
  context: RepoContext,
  params: { branchName: string; issueNumber: number }
): Promise<GitHubActionResult> {
  try {
    // Step 1: Get repository ID and issue node ID, and check if already linked
    const repoAndIssueQuery = await octokit.graphql<{
      repository: {
        id: string;
        issue: {
          id: string;
          linkedBranches: {
            nodes: Array<{ ref: { name: string } }>;
          };
        };
      };
    }>(`
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          id
          issue(number: $number) {
            id
            linkedBranches(first: 20) {
              nodes {
                ref {
                  name
                }
              }
            }
          }
        }
      }
    `, {
      owner: context.owner,
      repo: context.repo,
      number: params.issueNumber,
    });

    // Check if this branch is already linked to this issue
    const linkedBranches = repoAndIssueQuery.repository.issue.linkedBranches.nodes;
    const alreadyLinked = linkedBranches.some(
      (node) => node.ref.name === params.branchName
    );

    if (alreadyLinked) {
      return {
        success: true,
        message: `Branch '${params.branchName}' is already linked to issue #${params.issueNumber}`,
        data: { branchName: params.branchName, issueNumber: params.issueNumber, alreadyLinked: true },
      };
    }

    // Step 2: Check if branch exists
    let branchExists = false;
    let branchSha: string | null = null;
    try {
      const { data: refData } = await octokit.git.getRef({
        owner: context.owner,
        repo: context.repo,
        ref: `heads/${params.branchName}`,
      });
      branchExists = true;
      branchSha = refData.object.sha;
    } catch {
      branchExists = false;
    }

    if (!branchExists) {
      return {
        success: false,
        message: `Branch '${params.branchName}' does not exist. Create the branch first using CREATE_BRANCH action.`,
        error: "Branch not found",
      };
    }

    // Step 3: Try to create the linked branch
    // GitHub's API limitation: createLinkedBranch only works for NEW branches
    // If the branch already exists (which we know it does), this will likely fail
    try {
      const result = await octokit.graphql<{
        createLinkedBranch: {
          linkedBranch: { ref: { name: string } } | null;
        };
      }>(`
        mutation($repositoryId: ID!, $issueId: ID!, $oid: GitObjectID!, $name: String!) {
          createLinkedBranch(input: {
            repositoryId: $repositoryId
            issueId: $issueId
            oid: $oid
            name: $name
          }) {
            linkedBranch {
              ref {
                name
              }
            }
          }
        }
      `, {
        repositoryId: repoAndIssueQuery.repository.id,
        issueId: repoAndIssueQuery.repository.issue.id,
        oid: branchSha,
        name: `refs/heads/${params.branchName}`,
      });

      if (result.createLinkedBranch.linkedBranch) {
        return {
          success: true,
          message: `Linked branch '${params.branchName}' to issue #${params.issueNumber}`,
          data: { branchName: params.branchName, issueNumber: params.issueNumber },
        };
      }
    } catch (mutationError) {
      // Expected to fail for existing branches - continue to fallback message
      console.log("createLinkedBranch mutation failed (expected for existing branches):", mutationError);
    }

    // If we get here, the branch exists but couldn't be linked via API
    // This is a GitHub API limitation - it can only link branches it creates
    return {
      success: false,
      message: `Cannot link existing branch '${params.branchName}' to issue #${params.issueNumber}. GitHub's API only supports linking branches created through the "Create a branch" feature. Workaround: Create a PR from this branch mentioning "Closes #${params.issueNumber}" in the description.`,
      error: "GitHub API limitation - cannot link pre-existing branches",
    };
  } catch (error) {
    const errorStr = String(error);
    console.error("[GitHub API] Failed to link branch:", {
      context,
      params,
      error: error instanceof Error ? error.message : errorStr,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (errorStr.includes("LINKED_BRANCH_EXISTS")) {
      return {
        success: false,
        message: `Branch '${params.branchName}' is already linked to another issue.`,
        error: errorStr,
      };
    }

    const errorMessage = parseGitHubError(error, "link branch to issue");
    return {
      success: false,
      message: errorMessage,
      error: errorStr,
    };
  }
}

// Get branches linked to an issue (from GitHub's Development section)
export async function getLinkedBranches(
  octokit: Octokit,
  context: RepoContext,
  params: { issueNumber: number }
): Promise<GitHubActionResult> {
  try {
    const result = await octokit.graphql<{
      repository: {
        issue: {
          linkedBranches: {
            nodes: Array<{ ref: { name: string } }>;
          };
        };
      };
    }>(`
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          issue(number: $number) {
            linkedBranches(first: 10) {
              nodes {
                ref {
                  name
                }
              }
            }
          }
        }
      }
    `, {
      owner: context.owner,
      repo: context.repo,
      number: params.issueNumber,
    });

    const branches = result.repository.issue.linkedBranches.nodes.map(
      (node) => node.ref.name
    );

    return {
      success: true,
      message: branches.length > 0
        ? `Found ${branches.length} linked branch(es): ${branches.join(", ")}`
        : `No branches linked to issue #${params.issueNumber}`,
      data: { branches, issueNumber: params.issueNumber },
    };
  } catch (error) {
    const errorMessage = parseGitHubError(error, "get linked branches");
    console.error("[GitHub API] Failed to get linked branches:", {
      context,
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: errorMessage,
      error: String(error),
    };
  }
}

// List branches in the repository
export async function listBranches(
  octokit: Octokit,
  context: RepoContext,
  params: { limit?: number }
): Promise<GitHubActionResult> {
  try {
    const { data } = await octokit.repos.listBranches({
      owner: context.owner,
      repo: context.repo,
      per_page: params.limit || 10,
    });
    const branches = data.map((b) => ({
      name: b.name,
      protected: b.protected,
    }));
    return {
      success: true,
      message: `Found ${branches.length} branch(es): ${branches.map(b => b.name).join(", ")}`,
      data: { branches },
    };
  } catch (error) {
    const errorMessage = parseGitHubError(error, "list branches");
    console.error("[GitHub API] Failed to list branches:", {
      context,
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: errorMessage,
      error: String(error),
    };
  }
}

// List user's repositories
export async function listRepos(
  octokit: Octokit,
  params: { limit?: number }
): Promise<GitHubActionResult> {
  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: params.limit || 10,
    });
    const repos = data.map((r) => ({
      name: r.full_name,
      url: r.html_url,
      description: r.description,
    }));
    return {
      success: true,
      message: `Found ${repos.length} repositories`,
      data: { repos },
    };
  } catch (error) {
    const errorMessage = parseGitHubError(error, "list repositories");
    console.error("[GitHub API] Failed to list repositories:", {
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: errorMessage,
      error: String(error),
    };
  }
}

// List issues for a repository
export async function listIssues(
  octokit: Octokit,
  context: RepoContext,
  params: { state?: "open" | "closed" | "all"; limit?: number }
): Promise<GitHubActionResult> {
  try {
    const { data } = await octokit.issues.listForRepo({
      owner: context.owner,
      repo: context.repo,
      state: params.state || "open",
      per_page: params.limit || 10,
    });
    // Filter out pull requests (GitHub API returns PRs as issues)
    const issues = data
      .filter((i) => !i.pull_request)
      .map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        url: i.html_url,
      }));
    return {
      success: true,
      message: `Found ${issues.length} issues`,
      data: { issues },
    };
  } catch (error) {
    const errorMessage = parseGitHubError(error, "list issues");
    console.error("[GitHub API] Failed to list issues:", {
      context,
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: errorMessage,
      error: String(error),
    };
  }
}

// List pull requests for a repository
export async function listPRs(
  octokit: Octokit,
  context: RepoContext,
  params: { state?: "open" | "closed" | "all"; limit?: number }
): Promise<GitHubActionResult> {
  try {
    const { data } = await octokit.pulls.list({
      owner: context.owner,
      repo: context.repo,
      state: params.state || "open",
      per_page: params.limit || 10,
    });
    const prs = data.map((p) => ({
      number: p.number,
      title: p.title,
      state: p.state,
      merged: !!p.merged_at,
      url: p.html_url,
    }));
    return {
      success: true,
      message: `Found ${prs.length} pull requests`,
      data: { prs },
    };
  } catch (error) {
    const errorMessage = parseGitHubError(error, "list pull requests");
    console.error("[GitHub API] Failed to list pull requests:", {
      context,
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: errorMessage,
      error: String(error),
    };
  }
}

// Check workflow/CI status
export async function checkWorkflow(
  octokit: Octokit,
  context: RepoContext,
  params: { branch?: string }
): Promise<GitHubActionResult> {
  try {
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
      owner: context.owner,
      repo: context.repo,
      branch: params.branch,
      per_page: 5,
    });
    const runs = data.workflow_runs.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      conclusion: r.conclusion,
      branch: r.head_branch,
      url: r.html_url,
    }));
    return {
      success: true,
      message: `Found ${runs.length} recent workflow runs`,
      data: { runs },
    };
  } catch (error) {
    const errorMessage = parseGitHubError(error, "check workflows");
    console.error("[GitHub API] Failed to check workflows:", {
      context,
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message: `${errorMessage} (Actions may not be enabled)`,
      error: String(error),
    };
  }
}

// Main dispatcher function
export async function executeGitHubAction(
  octokit: Octokit,
  context: RepoContext,
  actionType: GitHubActionType,
  params: Record<string, unknown>
): Promise<GitHubActionResult> {
  switch (actionType) {
    case "CREATE_ISSUE":
      return createIssue(
        octokit,
        context,
        params as { title: string; body?: string; labels?: string[] }
      );
    case "ADD_COMMENT":
      return addComment(
        octokit,
        context,
        params as { issueNumber: number; body: string }
      );
    case "CREATE_BRANCH":
      return createBranch(
        octokit,
        context,
        params as { branchName: string; fromBranch?: string; issueNumber?: number }
      );
    case "CREATE_PR":
      return createPR(
        octokit,
        context,
        params as { title: string; body?: string; head: string; base?: string }
      );
    case "LINK_BRANCH":
      return linkBranch(
        octokit,
        context,
        params as { branchName: string; issueNumber: number }
      );
    case "LIST_REPOS":
      return listRepos(octokit, params as { limit?: number });
    case "LIST_ISSUES":
      return listIssues(
        octokit,
        context,
        params as { state?: "open" | "closed" | "all"; limit?: number }
      );
    case "LIST_PRS":
      return listPRs(
        octokit,
        context,
        params as { state?: "open" | "closed" | "all"; limit?: number }
      );
    case "CHECK_WORKFLOW":
      return checkWorkflow(
        octokit,
        context,
        params as { branch?: string }
      );
    case "GET_LINKED_BRANCHES":
      return getLinkedBranches(
        octokit,
        context,
        params as { issueNumber: number }
      );
    case "LIST_BRANCHES":
      return listBranches(
        octokit,
        context,
        params as { limit?: number }
      );
    default:
      return {
        success: false,
        message: `Unknown action type: ${actionType}`,
      };
  }
}
