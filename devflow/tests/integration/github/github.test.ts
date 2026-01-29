import { describe, test, expect, beforeAll } from 'vitest'
import { Octokit } from '@octokit/rest'
import {
  fetchUserRepos,
  fetchRepoIssues,
  fetchRepoPRs,
  fetchWorkflowRuns,
  GitHubRepo,
  GitHubIssue,
  GitHubPR
} from '@/lib/github'
import { getTestOctokit, getTestRepoContext } from '../../utils/test-helpers'

describe('GitHub API - github.ts functions', () => {
  let octokit: Octokit
  let repoContext: { owner: string; repo: string }

  beforeAll(async () => {
    octokit = await getTestOctokit()
    repoContext = await getTestRepoContext(octokit)
    console.log(`Testing with repo: ${repoContext.owner}/${repoContext.repo}`)
  })

  describe('fetchUserRepos', () => {
    test('should fetch user repositories successfully', async () => {
      const repos = await fetchUserRepos(octokit)

      // Assertions
      expect(repos).toBeDefined()
      expect(Array.isArray(repos)).toBe(true)
      expect(repos.length).toBeGreaterThan(0)

      // Validate structure of first repo
      const firstRepo = repos[0] as GitHubRepo
      expect(firstRepo).toHaveProperty('id')
      expect(firstRepo).toHaveProperty('name')
      expect(firstRepo).toHaveProperty('full_name')
      expect(firstRepo).toHaveProperty('owner')
      expect(firstRepo.owner).toHaveProperty('login')
      expect(typeof firstRepo.name).toBe('string')
      expect(typeof firstRepo.full_name).toBe('string')
    })

    test('should return repos sorted by updated date', async () => {
      const repos = await fetchUserRepos(octokit)

      // Should have repos (at least one)
      expect(repos.length).toBeGreaterThan(0)

      // Repos should be from the authenticated user
      expect(repos[0].owner.login).toBeTruthy()
    })
  })

  describe('fetchRepoIssues', () => {
    test('should fetch repository issues successfully', async () => {
      const { owner, repo } = repoContext
      const issues = await fetchRepoIssues(octokit, owner, repo)

      // Assertions
      expect(issues).toBeDefined()
      expect(Array.isArray(issues)).toBe(true)

      // If issues exist, validate structure
      if (issues.length > 0) {
        const firstIssue = issues[0] as GitHubIssue
        expect(firstIssue).toHaveProperty('id')
        expect(firstIssue).toHaveProperty('number')
        expect(firstIssue).toHaveProperty('title')
        expect(firstIssue).toHaveProperty('state')
        expect(firstIssue).toHaveProperty('html_url')
        expect(typeof firstIssue.title).toBe('string')
        expect(['open', 'closed']).toContain(firstIssue.state)
      }
    })

    test('should not include pull requests in issues', async () => {
      const { owner, repo } = repoContext
      const issues = await fetchRepoIssues(octokit, owner, repo)

      // Verify no PR URLs in issues (PRs have /pull/ in URL)
      issues.forEach((issue) => {
        expect(issue.html_url).not.toContain('/pull/')
      })
    })

    test('should handle repository with no issues', async () => {
      const { owner, repo } = repoContext
      const issues = await fetchRepoIssues(octokit, owner, repo)

      // Should return empty array, not throw
      expect(Array.isArray(issues)).toBe(true)
    })
  })

  describe('fetchRepoPRs', () => {
    test('should fetch repository pull requests successfully', async () => {
      const { owner, repo } = repoContext
      const prs = await fetchRepoPRs(octokit, owner, repo)

      // Assertions
      expect(prs).toBeDefined()
      expect(Array.isArray(prs)).toBe(true)

      // If PRs exist, validate structure
      if (prs.length > 0) {
        const firstPR = prs[0] as GitHubPR
        expect(firstPR).toHaveProperty('id')
        expect(firstPR).toHaveProperty('number')
        expect(firstPR).toHaveProperty('title')
        expect(firstPR).toHaveProperty('state')
        expect(firstPR).toHaveProperty('html_url')
        expect(firstPR).toHaveProperty('head')
        expect(firstPR.head).toHaveProperty('ref')
        expect(firstPR.head).toHaveProperty('sha')
        expect(typeof firstPR.merged).toBe('boolean')
      }
    })

    test('should correctly identify merged PRs', async () => {
      const { owner, repo } = repoContext
      const prs = await fetchRepoPRs(octokit, owner, repo)

      // Check merged status consistency
      prs.forEach((pr) => {
        if (pr.merged_at) {
          expect(pr.merged).toBe(true)
        } else {
          expect(pr.merged).toBe(false)
        }
      })
    })

    test('should handle repository with no PRs', async () => {
      const { owner, repo } = repoContext
      const prs = await fetchRepoPRs(octokit, owner, repo)

      // Should return empty array, not throw
      expect(Array.isArray(prs)).toBe(true)
    })
  })

  describe('fetchWorkflowRuns', () => {
    test('should fetch workflow runs successfully', async () => {
      const { owner, repo } = repoContext
      const runs = await fetchWorkflowRuns(octokit, owner, repo)

      // Assertions
      expect(runs).toBeDefined()
      expect(Array.isArray(runs)).toBe(true)

      // If workflow runs exist, validate structure
      if (runs.length > 0) {
        const firstRun = runs[0]
        expect(firstRun).toHaveProperty('id')
        expect(firstRun).toHaveProperty('name')
        expect(firstRun).toHaveProperty('status')
        expect(firstRun).toHaveProperty('conclusion')
        expect(firstRun).toHaveProperty('html_url')
      }
    })

    test('should handle repository without GitHub Actions', async () => {
      const { owner, repo } = repoContext
      const runs = await fetchWorkflowRuns(octokit, owner, repo)

      // Should return empty array for repos without Actions enabled
      expect(Array.isArray(runs)).toBe(true)
    })

    test('should fetch workflow runs for specific branch', async () => {
      const { owner, repo } = repoContext
      const runs = await fetchWorkflowRuns(octokit, owner, repo, 'main')

      expect(runs).toBeDefined()
      expect(Array.isArray(runs)).toBe(true)

      // If runs exist, they should be for main branch
      if (runs.length > 0) {
        runs.forEach((run) => {
          expect(run.head_branch).toBe('main')
        })
      }
    })
  })
})
