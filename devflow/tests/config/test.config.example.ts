/**
 * Example Test Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Find your userId by running:
 *    npm run db:studio
 *    (or: npx prisma studio)
 *    Then navigate to the User table and copy your user ID
 *
 * 2. Set the TEST_USER_ID_GITHUB_API environment variable:
 *    export TEST_USER_ID_GITHUB_API=clxxxxxxxxxxxxx
 *
 * 3. Run tests:
 *    npm run test:run
 *
 * OPTIONAL:
 * - Set TEST_REPO_OWNER and TEST_REPO_NAME for specific repo testing
 * - Set TEST_ISSUE_NUMBER to test issue-specific operations
 *
 * ENVIRONMENT VARIABLES:
 * - TEST_USER_ID_GITHUB_API (REQUIRED): Your user ID from the database
 * - TEST_REPO_OWNER (optional): GitHub username/org for test repository
 * - TEST_REPO_NAME (optional): Name of test repository
 * - TEST_ISSUE_NUMBER (optional): Specific issue number to test
 *
 * EXAMPLE .env.local addition:
 * TEST_USER_ID_GITHUB_API=clxxxxxxxxxxxxx
 * TEST_REPO_OWNER=your-github-username
 * TEST_REPO_NAME=your-test-repo
 * TEST_ISSUE_NUMBER=1
 */

export const exampleConfig = {
  userId: 'clxxxxxxxxxxxxx',  // REQUIRED: Your user ID from the database

  // OPTIONAL: Specific test repository (otherwise uses first available)
  testRepoOwner: 'your-github-username',
  testRepoName: 'your-test-repo',

  // OPTIONAL: Specific test issue number
  testIssueNumber: 1,
}
