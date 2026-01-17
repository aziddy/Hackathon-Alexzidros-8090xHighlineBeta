import { Octokit } from "@octokit/rest";
import { GitHubActionType, GitHubActionResult } from "@/types";

// Actions that require user confirmation before execution
export const CONFIRMATION_REQUIRED: GitHubActionType[] = [
  "CREATE_ISSUE",
  "ADD_COMMENT",
  "CREATE_BRANCH",
];

// Actions that can be executed immediately (read-only)
export const READ_ONLY_ACTIONS: GitHubActionType[] = [
  "LIST_REPOS",
  "LIST_ISSUES",
  "LIST_PRS",
  "CHECK_WORKFLOW",
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
    default:
      return {
        success: false,
        message: `Unknown action type: ${actionType}`,
      };
  }
}
