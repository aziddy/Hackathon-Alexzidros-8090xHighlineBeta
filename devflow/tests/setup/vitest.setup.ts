import { beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { testConfig } from '../config/test.config'

// Validate configuration before running tests
beforeAll(async () => {
  console.log('\n🔧 Running test setup...')
  console.log(`📝 Test User ID: ${testConfig.userId}`)

  // Verify user exists in database
  const user = await prisma.user.findUnique({
    where: { id: testConfig.userId },
    include: {
      accounts: {
        where: { provider: 'github' }
      }
    }
  })

  if (!user) {
    throw new Error(
      `User with ID '${testConfig.userId}' not found in database.\n` +
      `Run 'npm run db:studio' to find your user ID.`
    )
  }

  if (!user.accounts || user.accounts.length === 0) {
    throw new Error(
      `User '${user.email}' has no linked GitHub account.\n` +
      `Please sign in to DevFlow with GitHub to link your account.`
    )
  }

  const githubAccount = user.accounts[0]
  if (!githubAccount.access_token) {
    throw new Error(
      `GitHub account for user '${user.email}' has no access token.\n` +
      `Please re-authenticate with GitHub.`
    )
  }

  console.log(`✅ User verified: ${user.email}`)
  console.log(`✅ GitHub account linked`)
  console.log(`✅ Access token available`)

  // Log optional config
  if (testConfig.testRepoOwner && testConfig.testRepoName) {
    console.log(`📦 Test repository: ${testConfig.testRepoOwner}/${testConfig.testRepoName}`)
  }
  if (testConfig.testIssueNumber) {
    console.log(`🎯 Test issue: #${testConfig.testIssueNumber}`)
  }
  console.log('')
})

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect()
  console.log('\n✨ Test cleanup complete\n')
})
