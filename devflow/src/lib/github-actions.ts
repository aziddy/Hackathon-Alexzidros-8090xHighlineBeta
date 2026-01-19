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
    return {
      success: false,
      message: "Failed to create issue",
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
    return {
      success: false,
      message: "Failed to add comment",
      error: String(error),
    };
  }
}

// Create a new branch
export async function createBranch(
  octokit: Octokit,
  context: RepoContext,
  params: { branchName: string; fromBranch?: string }
): Promise<GitHubActionResult> {
  try {
    const baseBranch = params.fromBranch || "main";

    // Get the SHA of the base branch
    const { data: refData } = await octokit.git.getRef({
      owner: context.owner,
      repo: context.repo,
      ref: `heads/${baseBranch}`,
    });

    // Create the new branch
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
    return {
      success: false,
      message: "Failed to create branch",
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
    return {
      success: false,
      message: "Failed to create pull request",
      error: String(error),
    };
  }
}

// Link a branch to an issue (makes it visible in GitHub's Development section)
export async function linkBranch(
  octokit: Octokit,
  context: RepoContext,
  params: { branchName: string; issueNumber: number }
): Promise<GitHubActionResult> {
  try {
    // Step 1: Get issue node ID via GraphQL
    const issueQuery = await octokit.graphql<{ repository: { issue: { id: string } } }>(`
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
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

    // Step 2: Get branch SHA
    const { data: refData } = await octokit.git.getRef({
      owner: context.owner,
      repo: context.repo,
      ref: `heads/${params.branchName}`,
    });

    // Step 3: Create linked branch via GraphQL mutation
    const createLinkedBranchResult = await octokit.graphql(`
      mutation($issueId: ID!, $oid: GitObjectID!, $name: String!) {
        createLinkedBranch(input: {
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
      issueId: issueQuery.repository.issue.id,
      oid: refData.object.sha,
      name: params.branchName,
    });

    console.log(createLinkedBranchResult);

    return {
      success: true,
      message: `Linked branch '${params.branchName}' to issue #${params.issueNumber}`,
      data: { branchName: params.branchName, issueNumber: params.issueNumber },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to link branch to issue",
      error: String(error),
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
    return {
      success: false,
      message: "Failed to get linked branches",
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
    return {
      success: false,
      message: "Failed to list branches",
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
    return {
      success: false,
      message: "Failed to list repositories",
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
    return {
      success: false,
      message: "Failed to list issues",
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
    return {
      success: false,
      message: "Failed to list pull requests",
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
    return {
      success: false,
      message: "Failed to check workflows (Actions may not be enabled)",
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
        params as { branchName: string; fromBranch?: string }
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
