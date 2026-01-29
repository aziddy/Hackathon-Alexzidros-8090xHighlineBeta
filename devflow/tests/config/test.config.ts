import { z } from 'zod'
import { config as dotenvConfig } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenvConfig({ path: path.resolve(process.cwd(), '.env.local') })

// Validation schema for test configuration
const TestConfigSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  testRepoOwner: z.string().optional(),
  testRepoName: z.string().optional(),
  testIssueNumber: z.number().optional(),
})

export type TestConfig = z.infer<typeof TestConfigSchema>

// Load and validate test configuration
export function loadTestConfig(): TestConfig {
  const config: TestConfig = {
    // REQUIRED: Specify your test user ID here
    // Find it by querying: SELECT id FROM User WHERE email = 'your@email.com'
    // Or use: npm run db:studio
    userId: process.env.TEST_USER_ID_GITHUB_API || '',

    // OPTIONAL: Specify test repo/issue for more targeted tests
    testRepoOwner: process.env.TEST_REPO_OWNER,
    testRepoName: process.env.TEST_REPO_NAME,
    testIssueNumber: process.env.TEST_ISSUE_NUMBER
      ? parseInt(process.env.TEST_ISSUE_NUMBER, 10)
      : undefined,
  }

  // Validate configuration
  const result = TestConfigSchema.safeParse(config)

  if (!result.success) {
    const errors = result.error.issues.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n')
    throw new Error(
      `Invalid test configuration:\n${errors}\n\n` +
      `Please set TEST_USER_ID_GITHUB_API environment variable or update tests/config/test.config.ts`
    )
  }

  return result.data
}

// Export singleton instance
export const testConfig = loadTestConfig()
