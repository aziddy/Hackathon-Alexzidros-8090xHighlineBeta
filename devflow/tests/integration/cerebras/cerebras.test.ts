import { describe, test, expect } from 'vitest'
import { generateAtomicSteps, GeneratedStep } from '@/lib/cerebras'
import type { StepType } from '@/types'

// Valid step types - imported from the actual codebase type definition
const VALID_STEP_TYPES: StepType[] = [
  'CREATE_BRANCH',
  'PULL_BRANCH',
  'CODE',
  'TEST',
  'RUN_TESTS',
  'COMMIT',
  'CREATE_PR',
  'REQUEST_REVIEW',
  'ADDRESS_COMMENTS',
  'GET_APPROVAL',
  'MERGE',
  'DEPLOY',
  'CLOSE_ISSUE',
  'CUSTOM',
]

// Test issue examples
const TEST_ISSUES = {
  bugFix: {
    title: 'Fix authentication error on login',
    body: 'Users are getting 401 errors when trying to log in with valid credentials. Need to check the JWT token validation logic.',
    labels: ['bug', 'high-priority'],
  },

  feature: {
    title: 'Add dark mode toggle to settings',
    body: 'Implement a dark mode toggle in the settings page with persistent storage using localStorage.',
    labels: ['feature', 'enhancement'],
  },

  docs: {
    title: 'Update API documentation for /api/users endpoint',
    body: 'Add examples and better descriptions for the new /api/users endpoint parameters',
    labels: ['documentation'],
  },

  simpleTypo: {
    title: 'Fix typo in README',
    body: null,
    labels: [],
  },

  complexFeature: {
    title: 'Implement real-time notifications system',
    body: 'Build a WebSocket-based notification system with:\n- Backend WebSocket server\n- Frontend notification UI\n- Database schema for notifications\n- Push notification integration\n- User preferences management',
    labels: ['feature', 'backend', 'frontend'],
  },
}

const REAL_WORLD_ENCOUNTERED_ISSUES = {
  'dummy-financial-app-one': {
    title: 'Change color for Food & Dining type of expense',
    body: 'Customers have been reporting they don\'t like the red on the Food & Dining expense type in the UI\n\nThey have been saying things like "I like food, it shouldn\'t be red. It should be a another color thats nice on the eyes"',
    labels: ['bug'],
    expectedSteps: [
      { type: 'CREATE_BRANCH', order: 1 },    // Create fix branch
      { type: 'PULL_BRANCH', order: 2 },     // Pull fix branch
      { type: 'CODE', order: 3 },             // Change Food & Dining color in UI
      { type: 'TEST', order: 4 },             // Write/update UI tests
      { type: 'RUN_TESTS', order: 5 },        // Run test suite
      { type: 'COMMIT', order: 6 },           // Commit changes
      { type: 'CREATE_PR', order: 7 },        // Create pull request
      { type: 'REQUEST_REVIEW', order: 8 },   // Request review
      { type: 'ADDRESS_COMMENTS', order: 9 }, // Address comments
      { type: 'GET_APPROVAL', order: 10 },     // Get approval
      { type: 'MERGE', order: 11 },            // Merge PR
      { type: 'CLOSE_ISSUE', order: 12 },     // Close issue
    ],
  },
}

// Helper functions for validation
function validateStepStructure(step: GeneratedStep) {
  // Check all required properties exist
  expect(step).toHaveProperty('name')
  expect(step).toHaveProperty('description')
  expect(step).toHaveProperty('type')
  expect(step).toHaveProperty('order')

  // Check types
  expect(typeof step.name).toBe('string')
  expect(step.name.length).toBeGreaterThan(0)

  expect(typeof step.description).toBe('string')
  expect(step.description.length).toBeGreaterThan(0)

  expect(typeof step.type).toBe('string')
  expect(VALID_STEP_TYPES).toContain(step.type)

  expect(typeof step.order).toBe('number')
  expect(step.order).toBeGreaterThan(0)
  expect(Number.isInteger(step.order)).toBe(true)
}

function validateStepsOrdering(steps: GeneratedStep[]) {
  const orders = steps.map((s) => s.order)

  // Check for duplicates
  const uniqueOrders = new Set(orders)
  expect(uniqueOrders.size).toBe(orders.length)

  // Check sequential ordering (should be 1, 2, 3, ...)
  const sortedOrders = [...orders].sort((a, b) => a - b)
  sortedOrders.forEach((order, index) => {
    expect(order).toBe(index + 1)
  })
}

describe('Cerebras LLM - generateAtomicSteps', () => {

describe('Expected Atomic Steps for Real-world issues', () => {
  test('should return expected atomic steps for real-world issues', async () => {
    const { title, body, labels } = REAL_WORLD_ENCOUNTERED_ISSUES['dummy-financial-app-one']
    const steps = await generateAtomicSteps(title, body, labels)
    const stepsWithoutNameAndDescription = steps.map(({ type, order }) => ({ type, order }))
    expect(stepsWithoutNameAndDescription).toEqual(REAL_WORLD_ENCOUNTERED_ISSUES['dummy-financial-app-one'].expectedSteps)
  })
})

  /*describe('Structure Validation', () => {
    test('should return array of GeneratedStep objects', async () => {
      const { title, body, labels } = TEST_ISSUES.bugFix
      const steps = await generateAtomicSteps(title, body, labels)

      expect(Array.isArray(steps)).toBe(true)
      expect(steps.length).toBeGreaterThan(0)
    })

    test('each step should have all required fields', async () => {
      const { title, body, labels } = TEST_ISSUES.feature
      const steps = await generateAtomicSteps(title, body, labels)

      expect(steps.length).toBeGreaterThan(0)

      // Validate every step
      steps.forEach((step) => {
        validateStepStructure(step)
      })
    })

    test('steps should be ordered correctly', async () => {
      const { title, body, labels } = TEST_ISSUES.bugFix
      const steps = await generateAtomicSteps(title, body, labels)

      validateStepsOrdering(steps)
    })
  }) */

  /*describe('Business Logic Validation', () => {
    test('feature request should include CREATE_BRANCH as first step', async () => {
      const { title, body, labels } = TEST_ISSUES.feature
      const steps = await generateAtomicSteps(title, body, labels)

      expect(steps.length).toBeGreaterThan(0)

      // First step should be CREATE_BRANCH
      const firstStep = steps[0]
      expect(firstStep.order).toBe(1)
      expect(firstStep.type).toBe('CREATE_BRANCH')
    })

    test('bug fix should include appropriate steps', async () => {
      const { title, body, labels } = TEST_ISSUES.bugFix
      const steps = await generateAtomicSteps(title, body, labels)

      const stepTypes = steps.map((s) => s.type)

      // Should include code changes
      expect(stepTypes).toContain('CODE')

      // Should include testing
      const hasTest = stepTypes.includes('TEST') || stepTypes.includes('RUN_TESTS')
      expect(hasTest).toBe(true)

      // Should end with closing issue
      const lastStep = steps[steps.length - 1]
      expect(lastStep.type).toBe('CLOSE_ISSUE')
    })

    test('should return 6-12 steps for standard issues', async () => {
      const { title, body, labels } = TEST_ISSUES.feature
      const steps = await generateAtomicSteps(title, body, labels)

      expect(steps.length).toBeGreaterThanOrEqual(6)
      expect(steps.length).toBeLessThanOrEqual(12)
    })

    test('all step types should be valid', async () => {
      const { title, body, labels } = TEST_ISSUES.complexFeature
      const steps = await generateAtomicSteps(title, body, labels)

      steps.forEach((step) => {
        expect(VALID_STEP_TYPES).toContain(step.type)
      })
    })
  }) */

  /*describe('Different Issue Types', () => {
    test('documentation issue may skip test steps', async () => {
      const { title, body, labels } = TEST_ISSUES.docs
      const steps = await generateAtomicSteps(title, body, labels)

      // Should return valid structure
      expect(steps.length).toBeGreaterThan(0)
      steps.forEach((step) => {
        validateStepStructure(step)
      })

      // Documentation issues may skip TEST/RUN_TESTS
      // But should still include CODE and COMMIT steps
      const stepTypes = steps.map((s) => s.type)
      expect(stepTypes).toContain('CODE')
      expect(stepTypes).toContain('COMMIT')
    })

    test('complex feature should return more steps', async () => {
      const { title, body, labels } = TEST_ISSUES.complexFeature
      const steps = await generateAtomicSteps(title, body, labels)

      // Complex features should have more steps (closer to 12)
      expect(steps.length).toBeGreaterThanOrEqual(8)
      expect(steps.length).toBeLessThanOrEqual(12)

      // Should include CODE, TEST, and likely deployment
      const stepTypes = steps.map((s) => s.type)
      expect(stepTypes).toContain('CODE')
      expect(stepTypes).toContain('TEST')
    })

    test('simple typo fix should return fewer steps', async () => {
      const { title, body, labels } = TEST_ISSUES.simpleTypo
      const steps = await generateAtomicSteps(title, body, labels)

      // Simple fixes should have fewer steps (closer to 6)
      expect(steps.length).toBeGreaterThanOrEqual(6)
      expect(steps.length).toBeLessThanOrEqual(10)

      // Should still include essential steps
      const stepTypes = steps.map((s) => s.type)
      expect(stepTypes).toContain('CODE')
      expect(stepTypes).toContain('COMMIT')
      expect(stepTypes).toContain('CLOSE_ISSUE')
    })

    test('issue with null body should still generate valid steps', async () => {
      const { title, body, labels } = TEST_ISSUES.simpleTypo
      const steps = await generateAtomicSteps(title, body, labels)

      expect(steps.length).toBeGreaterThan(0)

      // Validate structure
      steps.forEach((step) => {
        validateStepStructure(step)
      })

      // Should use title to infer intent
      const firstStep = steps[0]
      expect(firstStep.type).toBe('CREATE_BRANCH')
    })
  })*/

  /* describe('Error Handling & Edge Cases', () => {
    test('empty title should return default steps', async () => {
      const steps = await generateAtomicSteps('', null, [])

      // Should fall back to default steps (10 steps)
      expect(steps.length).toBe(10)

      // Validate structure
      steps.forEach((step) => {
        validateStepStructure(step)
      })

      // First step should be CREATE_BRANCH
      expect(steps[0].type).toBe('CREATE_BRANCH')

      // Last step should be CLOSE_ISSUE
      expect(steps[steps.length - 1].type).toBe('CLOSE_ISSUE')
    })

    test('very long description should complete successfully', async () => {
      const longBody = 'This is a very long description. '.repeat(100) // ~3000 chars
      const steps = await generateAtomicSteps('Complex feature', longBody, ['feature'])

      expect(steps.length).toBeGreaterThan(0)

      steps.forEach((step) => {
        validateStepStructure(step)
      })
    })

    test('special characters should be handled gracefully', async () => {
      const title = 'Fix issue with UTF-8 encoding: café, naïve, 日本語'
      const body = 'Handle special chars: <script>, &amp;, "quotes", \'apostrophes\''
      const steps = await generateAtomicSteps(title, body, ['bug'])

      expect(steps.length).toBeGreaterThan(0)

      steps.forEach((step) => {
        validateStepStructure(step)
      })
    })
  }) */
})
