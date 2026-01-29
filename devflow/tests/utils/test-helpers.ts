import { Octokit } from '@octokit/rest'
import { prisma } from '@/lib/prisma'
import { createOctokit } from '@/lib/github'
import { testConfig } from '../config/test.config'

/**
 * Get authenticated Octokit instance for testing
 */
export async function getTestOctokit(): Promise<Octokit> {
  const account = await prisma.account.findFirst({
    where: {
      userId: testConfig.userId,
      provider: 'github'
    }
  })

  if (!account || !account.access_token) {
    throw new Error('No GitHub account found for test user')
  }

  return createOctokit(account.access_token)
}

/**
 * Get test repository context (owner/repo)
 * Uses config values if specified, otherwise fetches first available repo
 */
export async function getTestRepoContext(octokit: Octokit): Promise<{ owner: string; repo: string }> {
  if (testConfig.testRepoOwner && testConfig.testRepoName) {
    return {
      owner: testConfig.testRepoOwner,
      repo: testConfig.testRepoName
    }
  }

  // Fetch first available repo
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 1
  })

  if (repos.length === 0) {
    throw new Error('No repositories found for test user')
  }

  return {
    owner: repos[0].owner.login,
    repo: repos[0].name
  }
}

/**
 * Get test issue number
 * Uses config value if specified, otherwise fetches first available issue
 */
export async function getTestIssueNumber(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<number | null> {
  if (testConfig.testIssueNumber) {
    return testConfig.testIssueNumber
  }

  // Fetch first available issue
  const { data: issues } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: 'all',
    per_page: 1
  })

  return issues.length > 0 ? issues[0].number : null
}
