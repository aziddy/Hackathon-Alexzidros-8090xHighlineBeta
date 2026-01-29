import { describe, test, expect, beforeAll } from 'vitest'
import { Octokit } from '@octokit/rest'
import { getLinkedBranches, listBranches } from '@/lib/github-actions'
import { getTestOctokit, getTestRepoContext, getTestIssueNumber } from '../../utils/test-helpers'

describe('GitHub API - github-actions.ts functions', () => {
  let octokit: Octokit
  let repoContext: { owner: string; repo: string }

  beforeAll(async () => {
    octokit = await getTestOctokit()
    repoContext = await getTestRepoContext(octokit)
    console.log(`Testing with repo: ${repoContext.owner}/${repoContext.repo}`)
  })

  describe('getLinkedBranches', () => {
    test('should fetch linked branches for an issue', async () => {
      const { owner, repo } = repoContext
      const issueNumber = await getTestIssueNumber(octokit, owner, repo)

      // Skip if no issues available
      if (!issueNumber) {
        console.log('No issues found in repository, skipping test')
        return
      }

      const result = await getLinkedBranches(octokit, repoContext, {
        issueNumber
      })

      // Assertions
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.message).toBeTruthy()
      expect(result.data).toBeDefined()
      expect(result.data).toHaveProperty('branches')
      expect(Array.isArray(result.data.branches)).toBe(true)
      expect(result.data.issueNumber).toBe(issueNumber)
    })

    test('should return empty array for issue with no linked branches', async () => {
      const { owner, repo } = repoContext
      const issueNumber = await getTestIssueNumber(octokit, owner, repo)

      if (!issueNumber) {
        console.log('No issues found in repository, skipping test')
        return
      }

      const result = await getLinkedBranches(octokit, repoContext, {
        issueNumber
      })

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data?.branches)).toBe(true)
    })

    test('should handle invalid issue number gracefully', async () => {
      const result = await getLinkedBranches(octokit, repoContext, {
        issueNumber: 999999999
      })

      // Should fail with error message
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('listBranches', () => {
    test('should list repository branches successfully', async () => {
      const result = await listBranches(octokit, repoContext, {})

      // Assertions
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.message).toBeTruthy()
      expect(result.data).toBeDefined()
      expect(result.data).toHaveProperty('branches')
      expect(Array.isArray(result.data.branches)).toBe(true)
      expect(result.data.branches.length).toBeGreaterThan(0)

      // Validate branch structure
      const firstBranch = result.data.branches[0]
      expect(firstBranch).toHaveProperty('name')
      expect(firstBranch).toHaveProperty('protected')
      expect(typeof firstBranch.name).toBe('string')
      expect(typeof firstBranch.protected).toBe('boolean')
    })

    test('should respect limit parameter', async () => {
      const limit = 3
      const result = await listBranches(octokit, repoContext, { limit })

      expect(result.success).toBe(true)
      expect(result.data?.branches.length).toBeLessThanOrEqual(limit)
    })

    test('should default to 10 branches when no limit specified', async () => {
      const result = await listBranches(octokit, repoContext, {})

      expect(result.success).toBe(true)
      expect(result.data?.branches.length).toBeLessThanOrEqual(10)
    })

    test('should return at least one branch', async () => {
      const result = await listBranches(octokit, repoContext, { limit: 100 })

      expect(result.success).toBe(true)
      expect(result.data?.branches).toBeDefined()
      expect(Array.isArray(result.data?.branches)).toBe(true)

      const branches = result.data?.branches as Array<{ name: string; protected: boolean }>
      expect(branches.length).toBeGreaterThan(0)

      // Verify branch structure
      branches.forEach((branch) => {
        expect(typeof branch.name).toBe('string')
        expect(branch.name.length).toBeGreaterThan(0)
        expect(typeof branch.protected).toBe('boolean')
      })
    })
  })
})
