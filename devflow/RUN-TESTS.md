# Integration Tests Guide

This guide explains how to set up and run the live integration tests for DevFlow.

## Overview

The test suite includes comprehensive live integration tests for:

### GitHub API Tests (19 tests)
All 6 read-only GitHub API operations:
- `fetchUserRepos` - List user repositories
- `fetchRepoIssues` - List repository issues
- `fetchRepoPRs` - List pull requests
- `fetchWorkflowRuns` - Get CI/CD workflow runs
- `getLinkedBranches` - Get branches linked to issue (GraphQL)
- `listBranches` - List repository branches

### Cerebras LLM API Tests (14 tests)
AI-powered atomic step generation:
- `generateAtomicSteps` - Generate development steps for GitHub issues
- Structure validation, business logic, different issue types, error handling

**Total: 33 test cases across 3 test suites**

## Prerequisites

### For GitHub API Tests:
1. **Authenticated GitHub account** - You must be signed into DevFlow with GitHub OAuth
2. **Valid access token** - Your GitHub account must have a valid access token stored in the database
3. **Test repositories** - Your GitHub account should have at least one repository (tests will use your repos)

### For Cerebras LLM API Tests:
1. **Cerebras API key** - Valid API key from https://cloud.cerebras.ai
2. **No additional setup** - Tests use predefined issue examples

## Setup Instructions

### Step 1: Install Dependencies

Dependencies should already be installed, but if needed:

```bash
npm install
```

### Step 2: Find Your User ID

Open Prisma Studio to find your user ID:

```bash
npm run db:studio
```

1. Navigate to the **User** table
2. Find your user record (by email)
3. Copy the **id** field value (e.g., `clxxxxxxxxxxxxx`)

### Step 3: Configure Environment Variables

Add your configuration to `.env.local`:

```bash
# Required for GitHub API tests - Your database user ID
TEST_USER_ID_GITHUB_API="clxxxxxxxxxxxxx"

# Required for Cerebras LLM API tests
CEREBRAS_API_KEY="your-cerebras-api-key"
```

**Optional**: Specify a specific repository/issue for testing:

```bash
# Optional - Test with a specific repository
TEST_REPO_OWNER="your-github-username"
TEST_REPO_NAME="your-repo-name"

# Optional - Test with a specific issue
TEST_ISSUE_NUMBER=1
```

If you don't specify these, the tests will automatically use:
- Your first repository (sorted by most recently updated)
- The first available issue in that repository

### Step 4: Verify Setup

The test setup will automatically verify:
- ✅ User exists in the database
- ✅ GitHub account is linked
- ✅ Access token is available

If any of these checks fail, you'll see a clear error message with instructions.

## Running Tests

### Run All Tests Once

```bash
npm run test:run
```

This runs all tests once and exits. Perfect for CI/CD or quick verification.

### Run Tests in Watch Mode

```bash
npm test
```

Tests will re-run automatically when files change. Great for development.

### Run Only GitHub API Tests

```bash
npm run test:github
```

Runs only the GitHub integration tests (skips any other test files).

### Run Only Cerebras API Tests

```bash
npm test -- cerebras.test.ts
```

Runs only the Cerebras LLM integration tests.

### Run Tests with UI

```bash
npm run test:ui
```

Opens an interactive browser UI for debugging tests. Useful for:
- Viewing test results visually
- Debugging failed tests
- Inspecting API responses

### Generate Coverage Report

```bash
npm run test:coverage
```

Generates a code coverage report for `src/lib/github*.ts` files.

## Test Output

### Successful Test Run

```
🔧 Running test setup...
📝 Test User ID: clxxxxxxxxxxxxx
✅ User verified: your@email.com
✅ GitHub account linked
✅ Access token available

Testing with repo: your-username/your-repo

✓ tests/integration/github/github.test.ts (12)
  ✓ GitHub API - github.ts functions
    ✓ fetchUserRepos (2)
    ✓ fetchRepoIssues (3)
    ✓ fetchRepoPRs (3)
    ✓ fetchWorkflowRuns (3)

✓ tests/integration/github/github-actions.test.ts (7)
  ✓ GitHub API - github-actions.ts functions
    ✓ getLinkedBranches (3)
    ✓ listBranches (4)

✓ tests/integration/cerebras/cerebras.test.ts (14)
  ✓ Cerebras LLM - generateAtomicSteps
    ✓ Structure Validation (3)
    ✓ Business Logic Validation (4)
    ✓ Different Issue Types (5)
    ✓ Error Handling & Edge Cases (2)

Test Files  3 passed (3)
     Tests  33 passed (33)
  Start at  10:30:00
  Duration  25.3s
```

### Configuration Error

If you forget to set `TEST_USER_ID_GITHUB_API`:

```
Error: Invalid test configuration:
  - userId: userId is required

Please set TEST_USER_ID_GITHUB_API environment variable or update tests/config/test.config.ts
```

**Solution**: Add `TEST_USER_ID_GITHUB_API` to your `.env.local` file.

## Test Behavior

### Real GitHub API Calls

- Tests make **actual API calls** to GitHub (not mocked)
- Uses your **real access token** from the database
- Tests against your **actual repositories**

### Sequential Execution

Tests run **one at a time** (not in parallel) to avoid GitHub API rate limiting.

### Graceful Degradation

Tests handle missing data gracefully:
- No issues? Tests skip gracefully with a message
- No PRs? Tests pass with empty array
- No GitHub Actions? Tests pass with empty array

### Error Handling Tests

Some tests intentionally trigger errors to verify error handling:
- Invalid issue numbers (e.g., 999999999)
- These console errors are **expected** and indicate proper error handling

Example:
```
[GitHub API] Failed to get linked branches: { ... error: 'Could not resolve to an Issue with the number of 999999999' }
```

This is **normal** - the test verifies the function handles this error correctly.

### Testing Non-Deterministic AI Output

**Cerebras LLM tests are different** - AI output varies between calls!

#### What We Test:
✅ **Structure** - Response has correct shape (name, description, type, order)
✅ **Field Types** - All fields are correct type (string, number, etc.)
✅ **Valid Enums** - Step types match allowed values (CREATE_BRANCH, CODE, TEST, etc.)
✅ **Business Logic** - First step is usually CREATE_BRANCH, steps are ordered
✅ **Range** - Number of steps is reasonable (6-12)

#### What We DON'T Test:
❌ **Exact names** - AI generates different names each time
❌ **Exact descriptions** - Content varies (this is expected)
❌ **Exact step count** - Varies based on issue complexity

This approach ensures tests are **stable** despite AI variability.

## Test Structure

```
tests/
├── config/
│   ├── test.config.ts          # Test configuration (loads .env.local)
│   └── test.config.example.ts  # Example configuration
├── setup/
│   └── vitest.setup.ts         # Global setup (validates user/token)
├── integration/
│   ├── github/
│   │   ├── github.test.ts      # Tests for github.ts (12 tests)
│   │   └── github-actions.test.ts  # Tests for github-actions.ts (7 tests)
│   └── cerebras/
│       └── cerebras.test.ts    # Tests for cerebras.ts (14 tests)
└── utils/
    └── test-helpers.ts         # Shared test utilities
```

## Timeouts

- **Test timeout**: 30 seconds per test (GitHub and Cerebras APIs can be slow)
- **Hook timeout**: 10 seconds for setup/teardown
- **Cerebras LLM**: Can take 5-15 seconds per call
- Tests automatically fail if they exceed these timeouts

## Cost Considerations

### Cerebras LLM Tests
- Each test makes a **real LLM API call** (costs tokens)
- ~10-14 tests = 10-14 API calls
- Estimated: 500-1000 tokens per call
- Total cost per test run: **minimal but not free**

Keep this in mind when running tests frequently. Consider running GitHub tests only in development, and full test suite before commits.

## Troubleshooting

### "Missing CEREBRAS_API_KEY"

**Cause**: CEREBRAS_API_KEY not in `.env.local`

**Solution**:
1. Get API key from https://cloud.cerebras.ai
2. Add to `.env.local`: `CEREBRAS_API_KEY="your-key"`
3. Restart tests

### "User not found in database"

**Cause**: Invalid `TEST_USER_ID_GITHUB_API`

**Solution**:
1. Run `npm run db:studio`
2. Check the User table for your user ID
3. Update `TEST_USER_ID_GITHUB_API` in `.env.local`

### "No linked GitHub account"

**Cause**: You haven't signed in with GitHub

**Solution**:
1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Sign in with GitHub
4. Try tests again

### "No access token"

**Cause**: GitHub token expired or missing

**Solution**: Re-authenticate with GitHub in the DevFlow app

### "No repositories found"

**Cause**: Your GitHub account has no repositories

**Solution**: Create at least one repository on GitHub, or specify a different user ID

### Tests timeout

**Cause**: GitHub API is slow or rate-limited

**Solution**:
- Wait a few minutes and try again
- Tests run sequentially to avoid rate limits
- Default timeout is 30 seconds per test

### Rate limit exceeded

**Cause**: Too many API requests

**Solution**:
- Wait 60 minutes for rate limit to reset
- Tests are designed to minimize API calls
- Sequential execution helps prevent this

## What Gets Tested

### ✅ Repository Operations
- Fetch user repositories
- Validate repository structure
- Check repo metadata (name, owner, description)

### ✅ Issue Operations
- Fetch repository issues
- Filter out pull requests
- Handle repos with no issues
- Get branches linked to issues

### ✅ Pull Request Operations
- Fetch repository PRs
- Identify merged PRs
- Handle repos with no PRs
- Validate PR metadata

### ✅ GitHub Actions
- Fetch workflow runs
- Handle repos without Actions
- Filter by branch

### ✅ Branch Operations
- List repository branches
- Check branch protection status
- Respect limit parameter

### ✅ Error Handling
- Invalid issue numbers
- Missing resources
- API errors
- GraphQL errors

## Advanced Usage

### Run Specific Test File

```bash
npx vitest tests/integration/github/github.test.ts
```

### Run Specific Test Suite

```bash
npx vitest -t "fetchUserRepos"
```

### Debug Mode

```bash
npx vitest --inspect-brk
```

Then open Chrome DevTools to debug.

### Update Snapshots

If you've modified return structures:

```bash
npm run test:run -- -u
```

## CI/CD Integration

For automated testing in CI/CD:

```bash
# Run tests once and exit with appropriate exit code
npm run test:run
```

Make sure to set `TEST_USER_ID_GITHUB_API` as a secret in your CI environment.

## Contributing

When adding new tests:

1. Follow existing test patterns
2. Use descriptive test names
3. Handle missing data gracefully
4. Add appropriate timeouts for API calls
5. Update this documentation if needed

## Questions?

- Test failures? Check the console output for detailed error messages
- Need help? Review test files for examples: `tests/integration/github/*.test.ts`
- GitHub API docs: https://docs.github.com/en/rest
