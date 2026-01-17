import { Octokit } from "@octokit/rest";

export function createOctokit(accessToken: string) {
  return new Octokit({
    auth: accessToken,
  });
}

export interface GitHubIssue {
  id: number;
  node_id: string;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  labels: Array<{ name: string }>;
  assignees: Array<{ login: string; avatar_url: string }> | null;
}

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  merged?: boolean;
  merged_at?: string | null;
  html_url: string;
  head: { ref: string; sha: string };
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  stargazers_count: number;
  open_issues_count: number;
}

// Fetch user's repositories
export async function fetchUserRepos(octokit: Octokit): Promise<GitHubRepo[]> {
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  });
  return data as GitHubRepo[];
}

// Fetch issues for a repository
export async function fetchRepoIssues(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitHubIssue[]> {
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: "all",
    per_page: 100,
    sort: "updated",
  });
  // Filter out pull requests (GitHub API returns PRs as issues)
  return data.filter((issue) => !issue.pull_request) as GitHubIssue[];
}

// Fetch PRs for a repository
export async function fetchRepoPRs(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitHubPR[]> {
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: "all",
    per_page: 100,
    sort: "updated",
  });
  // Map to include merged status based on merged_at
  return data.map((pr) => ({
    ...pr,
    merged: !!pr.merged_at,
  })) as GitHubPR[];
}

// Find linked PR for an issue
export function findLinkedPR(issueNumber: number, prs: GitHubPR[]): GitHubPR | null {
  const patterns = [
    `#${issueNumber}`,
    `fixes #${issueNumber}`,
    `closes #${issueNumber}`,
    `resolves #${issueNumber}`,
  ];

  for (const pr of prs) {
    const body = (pr.body || "").toLowerCase();
    const title = pr.title.toLowerCase();

    for (const pattern of patterns) {
      if (body.includes(pattern.toLowerCase()) || title.includes(pattern.toLowerCase())) {
        return pr;
      }
    }
  }

  return null;
}

// Get GitHub Actions status for a repository
export async function fetchWorkflowRuns(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string = "main"
) {
  try {
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      branch,
      per_page: 5,
    });
    return data.workflow_runs;
  } catch (error) {
    // Actions might not be enabled
    return [];
  }
}

// Check if a PR is merged
export async function checkPRMerged(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<boolean> {
  try {
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    return data.merged;
  } catch (error) {
    return false;
  }
}

// Get PR reviews
export async function fetchPRReviews(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
) {
  try {
    const { data } = await octokit.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
    });
    return data;
  } catch (error) {
    return [];
  }
}
