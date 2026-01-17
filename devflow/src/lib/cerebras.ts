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

export async function generateAtomicSteps(
  title: string,
  body: string | null,
  labels: string[]
): Promise<GeneratedStep[]> {
  const systemPrompt = `You are a developer productivity assistant. Given a GitHub issue, generate a list of atomic steps needed to complete it.

Each step should be one of these types:
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

Guidelines:
- Generate between 5-10 steps depending on complexity
- Bug fixes usually need fewer steps
- Features need more comprehensive steps
- Consider the labels to determine if tests are needed
- Be specific in step descriptions
- Order steps logically

Return ONLY a valid JSON object with this structure:
{
  "steps": [
    { "name": "Short step name", "description": "Detailed description", "type": "CODE", "order": 1 },
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
      max_tokens: 1024,
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
    { name: "Implement the feature/fix", description: "Write the necessary code changes", type: "CODE", order: 1 },
    { name: "Write unit tests", description: "Create tests to verify the changes", type: "TEST", order: 2 },
    { name: "Run test suite", description: "Execute all tests to ensure nothing is broken", type: "RUN_TESTS", order: 3 },
    { name: "Commit changes", description: "Commit the changes with a descriptive message", type: "COMMIT", order: 4 },
    { name: "Create pull request", description: "Open a PR for code review", type: "CREATE_PR", order: 5 },
    { name: "Request review", description: "Ask teammates to review the PR", type: "REQUEST_REVIEW", order: 6 },
    { name: "Get approval", description: "Receive approval from reviewers", type: "GET_APPROVAL", order: 7 },
    { name: "Merge to main", description: "Merge the approved PR", type: "MERGE", order: 8 },
    { name: "Close issue", description: "Mark the issue as complete", type: "CLOSE_ISSUE", order: 9 },
  ];
}
