import Cerebras from "@cerebras/cerebras_cloud_sdk";

export const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export const MODEL = "llama-3.3-70b";

export interface GeneratedStep {
  name: string;
  description: string;
  type: string;
  checkMethod?: string;
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
- CREATE_BRANCH: Create a feature branch for the issue (should be FIRST step for new features)
- CODE: Write or update code
- TEST: Write unit tests
- RUN_TESTS: Run test suite
- COMMIT: Commit changes
- CREATE_PR: Create pull request
- REQUEST_REVIEW: Request PR reviews
- ADDRESS_COMMENTS: Address review feedback (only if likely needed)
- GET_APPROVAL: Get PR approved
- MERGE: Merge to main
- DEPLOY: Deploy to production (only for features that need deployment)
- CLOSE_ISSUE: Close the issue

Each step MUST have a checkMethod indicating how it can be verified:
- MCP_OR_MANUAL: Verified via IDE (MCP) or manual confirmation (for CODE, TEST, RUN_TESTS, COMMIT, ADDRESS_COMMENTS)
- MCP: Only verifiable via IDE (rarely used)
- MANUAL: Only manual confirmation (for complex steps that can't be automated)
- MCP_OR_API: Via IDE or GitHub API (for CREATE_BRANCH, DEPLOY)
- API: Only verifiable via GitHub API (for CREATE_PR, REQUEST_REVIEW, GET_APPROVAL, MERGE, CLOSE_ISSUE)

Guidelines:
- Generate between 5-10 steps depending on complexity
- For NEW features, always start with CREATE_BRANCH as the first step
- For bug fixes on existing branches, you may skip CREATE_BRANCH
- Bug fixes usually need fewer steps
- Features need more comprehensive steps
- Consider the labels to determine if tests are needed
- Be specific in step descriptions
- Order steps logically
- ALWAYS include the checkMethod for each step

Return ONLY a valid JSON object with this structure:
{
  "steps": [
    { "name": "Short step name", "description": "Detailed description", "type": "CREATE_BRANCH", "checkMethod": "MCP_OR_API", "order": 1 },
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

    const parsed = JSON.parse(content);
    return parsed.steps || [];
  } catch (error) {
    console.error("Error generating steps:", error);
    // Return default steps as fallback
    return getDefaultSteps();
  }
}

function getDefaultSteps(): GeneratedStep[] {
  return [
    { name: "Create feature branch", description: "Create a new branch from main for this issue", type: "CREATE_BRANCH", checkMethod: "MCP_OR_API", order: 1 },
    { name: "Implement the feature/fix", description: "Write the necessary code changes", type: "CODE", checkMethod: "MCP_OR_MANUAL", order: 2 },
    { name: "Write unit tests", description: "Create tests to verify the changes", type: "TEST", checkMethod: "MCP_OR_MANUAL", order: 3 },
    { name: "Run test suite", description: "Execute all tests to ensure nothing is broken", type: "RUN_TESTS", checkMethod: "MCP_OR_MANUAL", order: 4 },
    { name: "Commit changes", description: "Commit the changes with a descriptive message", type: "COMMIT", checkMethod: "MCP_OR_MANUAL", order: 5 },
    { name: "Create pull request", description: "Open a PR for code review", type: "CREATE_PR", checkMethod: "API", order: 6 },
    { name: "Request review", description: "Ask teammates to review the PR", type: "REQUEST_REVIEW", checkMethod: "API", order: 7 },
    { name: "Get approval", description: "Receive approval from reviewers", type: "GET_APPROVAL", checkMethod: "API", order: 8 },
    { name: "Merge to main", description: "Merge the approved PR", type: "MERGE", checkMethod: "API", order: 9 },
    { name: "Close issue", description: "Mark the issue as complete", type: "CLOSE_ISSUE", checkMethod: "API", order: 10 },
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
      max_tokens: 256,
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
