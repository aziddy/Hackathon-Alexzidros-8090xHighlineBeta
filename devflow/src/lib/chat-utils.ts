import { AtomicStep, GitHubActionType } from "@/types";

export interface ParsedAction {
  type: "mark_step_complete";
  stepNumber: number;
}

export interface ParsedGitHubAction {
  type: GitHubActionType;
  params: Record<string, unknown>;
}

export interface ParseResult {
  cleanMessage: string;
  action: ParsedAction | null;
  githubAction: ParsedGitHubAction | null;
}

export interface RepoContext {
  owner: string;
  repo: string;
}

/**
 * Build the system prompt for the chat assistant with issue and steps context
 */
export function buildChatSystemPrompt(
  issue: { title: string; body?: string; labels?: string[] },
  steps: AtomicStep[],
  progress: number,
  repoContext?: RepoContext
): string {
  const stepsContext = steps
    .sort((a, b) => a.order - b.order)
    .map((s, i) => {
      const statusEmoji = {
        PENDING: "[ ]",
        IN_PROGRESS: "[~]",
        COMPLETED: "[x]",
        BLOCKED: "[!]",
        SKIPPED: "[-]",
      }[s.status];
      return `${i + 1}. ${statusEmoji} ${s.name} (${s.type}) - ${s.status}${s.description ? `\n   Description: ${s.description}` : ""}`;
    })
    .join("\n");

  const repoInfo = repoContext
    ? `\n## Repository Context\n**Owner:** ${repoContext.owner}\n**Repo:** ${repoContext.repo}\n`
    : "";

  return `You are DevFlow Assistant, an AI helper for software development workflows. You are helping a developer work on a GitHub issue.

## Current Issue
**Title:** ${issue.title}
**Description:** ${issue.body || "No description provided"}
**Labels:** ${issue.labels?.join(", ") || "None"}
${repoInfo}
## Atomic Steps (${progress}% complete)
${stepsContext || "No steps generated yet."}

## Your Capabilities
1. **Explain steps**: Describe what each step means, why it's important, and how to complete it
2. **Track progress**: Summarize what's done, what's next, and overall progress
3. **Suggest actions**: Recommend the logical next step based on current status
4. **Mark steps complete**: When the user says they completed a step, you can mark it done
5. **GitHub Actions**: You can perform GitHub operations on behalf of the user

## Action Commands

### Step Completion
When the user wants to mark a step as complete:
- Use this format at the END of your response: [[ACTION:COMPLETE_STEP:stepNumber]]
- Example: If user says "I finished writing the tests", respond helpfully AND include [[ACTION:COMPLETE_STEP:3]]

### GitHub Actions
You can perform GitHub operations using this format at the END of your response:
[[ACTION:GITHUB:{"type":"ACTION_TYPE","params":{...}}]]

Available GitHub actions:

**Write actions (require confirmation):**
- CREATE_ISSUE: Create a new issue
  {"type":"CREATE_ISSUE","params":{"title":"Issue title","body":"Description","labels":["bug"]}}

- ADD_COMMENT: Add comment to issue/PR
  {"type":"ADD_COMMENT","params":{"issueNumber":123,"body":"Comment text"}}

- CREATE_BRANCH: Create a new branch
  {"type":"CREATE_BRANCH","params":{"branchName":"feature/my-branch","fromBranch":"main"}}

**Read actions (execute immediately):**
- LIST_ISSUES: List repository issues
  {"type":"LIST_ISSUES","params":{"state":"open","limit":10}}

- LIST_PRS: List pull requests
  {"type":"LIST_PRS","params":{"state":"open","limit":10}}

- CHECK_WORKFLOW: Check CI/CD status
  {"type":"CHECK_WORKFLOW","params":{"branch":"main"}}

- LIST_REPOS: List user's repositories
  {"type":"LIST_REPOS","params":{"limit":10}}

## Guidelines
- Be concise but helpful
- Use the step numbers when referring to specific steps
- Only include ONE action per response (either step or GitHub)
- For write actions, briefly explain what you're about to do
- For read actions, summarize the results helpfully after they execute
- Keep responses short - 2-3 sentences max unless explaining something complex
- If all steps are complete, congratulate the developer!`;
}

/**
 * Parse the AI response to extract any action commands
 * Supports:
 *   - [[ACTION:COMPLETE_STEP:3]]
 *   - [[ACTION:GITHUB:{"type":"CREATE_ISSUE","params":{"title":"..."}}]]
 */
export function parseActionFromResponse(response: string): ParseResult {
  let action: ParsedAction | null = null;
  let githubAction: ParsedGitHubAction | null = null;
  let cleanMessage = response;

  // Pattern 1: Step completion [[ACTION:COMPLETE_STEP:3]]
  const stepRegex = /\[\[ACTION:COMPLETE_STEP:(\d+)\]\]/g;
  const stepMatch = stepRegex.exec(response);
  if (stepMatch) {
    const [fullMatch, stepNum] = stepMatch;
    action = {
      type: "mark_step_complete",
      stepNumber: parseInt(stepNum, 10),
    };
    cleanMessage = cleanMessage.replace(fullMatch, "").trim();
  }

  // Pattern 2: GitHub action [[ACTION:GITHUB:{...}]]
  const githubRegex = /\[\[ACTION:GITHUB:(\{[\s\S]*?\})\]\]/g;
  const githubMatch = githubRegex.exec(cleanMessage);
  if (githubMatch) {
    const [fullMatch, jsonStr] = githubMatch;
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.type && parsed.params) {
        githubAction = {
          type: parsed.type as GitHubActionType,
          params: parsed.params,
        };
      }
    } catch (e) {
      console.error("Failed to parse GitHub action JSON:", e);
    }
    cleanMessage = cleanMessage.replace(fullMatch, "").trim();
  }

  return { cleanMessage, action, githubAction };
}

/**
 * Get a step by its display number (1-indexed)
 */
export function getStepByNumber(steps: AtomicStep[], stepNumber: number): AtomicStep | null {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  return sorted[stepNumber - 1] || null;
}
