import Cerebras from "@cerebras/cerebras_cloud_sdk";

export const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export const MODEL = "llama-3.3-70b";

export interface GeneratedStep {
  name: string;
  description: string;
  type: string;
  order: number;
}

export interface ApiParseResult {
  isComplete: boolean;
  explanation: string;
  confidence: number;
}

export async function generateAtomicSteps(
  title: string,
  body: string | null,
  labels: string[]
): Promise<GeneratedStep[]> {
  const systemPrompt = `You are a developer productivity assistant. Given a GitHub issue, generate a list of atomic steps needed to complete it.

Each step should be one of these types:
- CREATE_BRANCH: Create a feature branch for the issue (MUST be FIRST step for most issues)
- PULL_BRANCH: Pull/checkout the newly created branch (MUST be step 2 after CREATE_BRANCH)
- CODE: Write or update code
- TEST: Write unit tests
- RUN_TESTS: Run test suite
- COMMIT: Commit changes
- CREATE_PR: Create pull request
- REQUEST_REVIEW: Request PR reviews
- ADDRESS_COMMENTS: Address review feedback (only if likely needed)
- GET_APPROVAL: Get PR approved
- MERGE: Merge to main
- DEPLOY: Deploy to production (include for all issues unless explicitly documentation-only)
- CLOSE_ISSUE: Close the issue

Each step MUST have a type from: CREATE_BRANCH, PULL_BRANCH, CODE, TEST, RUN_TESTS, COMMIT, CREATE_PR, REQUEST_REVIEW, ADDRESS_COMMENTS, GET_APPROVAL, MERGE, DEPLOY, CLOSE_ISSUE, CUSTOM.
The checkMethod will be automatically assigned based on the step type.

Guidelines:
- Generate between 6-12 steps depending on complexity
- **CRITICAL**: For MOST issues, step 1 MUST be CREATE_BRANCH
  - Only skip CREATE_BRANCH if the issue explicitly states it's working on an existing branch
  - Any code change, bug fix, or feature needs a branch
  - If unsure, include CREATE_BRANCH as step 1
- **CRITICAL**: PULL_BRANCH must ALWAYS be step 2 immediately after CREATE_BRANCH
  - This represents pulling/checking out the newly created branch locally
  - Required for all standard workflows
- For TEST and RUN_TESTS steps, use the following logic:
  - **SKIP** TEST and RUN_TESTS if ANY of these conditions are true:
    - Issue is labeled with: ui, ux, style, styling, css, design, documentation, docs, chore
    - Issue ONLY mentions visual/styling changes: colors, fonts, spacing, margins, padding, borders, shadows, opacity, animations (without logic changes)
    - Issue is a simple typo fix or text update
  - **INCLUDE** TEST and RUN_TESTS if ANY of these conditions are true:
    - Issue mentions backend logic, API changes, database, authentication, business logic
    - Issue is labeled with: bug (and involves logic), feature, enhancement (with new functionality)
    - Issue involves complex features requiring multiple code changes
  - When in doubt about complexity, INCLUDE testing steps for safety
- Be specific in step descriptions
- Order steps logically: CREATE_BRANCH → PULL_BRANCH → CODE → [TEST → RUN_TESTS (conditional)] → COMMIT → CREATE_PR → REQUEST_REVIEW → ADDRESS_COMMENTS → GET_APPROVAL → MERGE → DEPLOY → CLOSE_ISSUE

Return ONLY a valid JSON object with this structure:
{
  "steps": [
    { "name": "Create feature branch", "description": "Create a new branch from main for this issue", "type": "CREATE_BRANCH", "order": 1 },
    { "name": "Pull feature branch", "description": "Pull/checkout the newly created branch locally", "type": "PULL_BRANCH", "order": 2 },
    { "name": "Update color code", "description": "Change the Food & Dining color to a more customer-friendly shade", "type": "CODE", "order": 3 },
    { "name": "Commit changes", "description": "Commit the color change with descriptive message", "type": "COMMIT", "order": 4 },
    { "name": "Create pull request", "description": "Open PR for the color change", "type": "CREATE_PR", "order": 5 },
    ...
  ]
}`;

  const userPrompt = `GitHub Issue:
Title: ${title}

Description: ${body || "No description provided"}

Labels: ${labels.length > 0 ? labels.join(", ") : "None"}

Generate the atomic steps for completing this issue.`;

  try {
    const response = await cerebras.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2024,
    });

    // Type assertion for Cerebras SDK response
    const choices = (response as { choices: Array<{ message?: { content?: string } }> }).choices;
    const content = choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Cerebras");
    }

    // Log the raw LLM response for debugging
    console.log("🤖 LLM Response for Atomic Steps Generation:", content);

    const parsed = JSON.parse(content);
    console.log("✅ Parsed Atomic Steps:", parsed.steps);
    return parsed.steps || [];
  } catch (error) {
    console.error("Error generating steps:", error);
    // Return default steps as fallback
    return getDefaultSteps();
  }
}

function getDefaultSteps(): GeneratedStep[] {
  return [
    { name: "Create feature branch", description: "Create a new branch from main for this issue", type: "CREATE_BRANCH", order: 1 },
    { name: "Pull feature branch", description: "Pull/checkout the newly created branch", type: "PULL_BRANCH", order: 2 },
    { name: "Implement the feature/fix", description: "Write the necessary code changes", type: "CODE", order: 3 },
    { name: "Write unit tests", description: "Create tests to verify the changes", type: "TEST", order: 4 },
    { name: "Run test suite", description: "Execute all tests to ensure nothing is broken", type: "RUN_TESTS", order: 5 },
    { name: "Commit changes", description: "Commit the changes with a descriptive message", type: "COMMIT", order: 6 },
    { name: "Create pull request", description: "Open a PR for code review", type: "CREATE_PR", order: 7 },
    { name: "Request review", description: "Ask teammates to review the PR", type: "REQUEST_REVIEW", order: 8 },
    { name: "Address comments", description: "Address any review feedback", type: "ADDRESS_COMMENTS", order: 9 },
    { name: "Get approval", description: "Receive approval from reviewers", type: "GET_APPROVAL", order: 10 },
    { name: "Merge to main", description: "Merge the approved PR", type: "MERGE", order: 11 },
    { name: "Deploy to production", description: "Deploy the changes", type: "DEPLOY", order: 12 },
    { name: "Close issue", description: "Mark the issue as complete", type: "CLOSE_ISSUE", order: 13 },
  ];
}

/**
 * Parse GitHub API response using Cerebras to determine step completion
 */
export async function parseApiResponseForStep(
  stepName: string,
  stepDescription: string,
  stepType: string,
  apiResponse: unknown,
  apiContext: string
): Promise<ApiParseResult> {
  const systemPrompt = `You are analyzing GitHub API responses to determine if a development step has been completed.

Given a step and its associated GitHub API response, determine:
1. Whether the step should be considered complete
2. A human-readable explanation of the current status
3. Your confidence level (0-1)

Be conservative - only mark complete if clearly done.

Return ONLY a valid JSON object:
{
  "isComplete": true/false,
  "explanation": "Human-readable explanation",
  "confidence": 0.95
}`;

  const userPrompt = `Step: ${stepName}
Description: ${stepDescription}
Step Type: ${stepType}
API Context: ${apiContext}

API Response:
${JSON.stringify(apiResponse, null, 2)}

Analyze whether this step is complete.`;

  try {
    const response = await cerebras.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 512,
    });

    const choices = (response as { choices: Array<{ message?: { content?: string } }> }).choices;
    const content = choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Cerebras");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error parsing API response:", error);
    return {
      isComplete: false,
      explanation: "Could not analyze the API response",
      confidence: 0,
    };
  }
}
