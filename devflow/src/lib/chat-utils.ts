import { AtomicStep } from "@/types";

export interface ParsedAction {
  type: "mark_step_complete";
  stepNumber: number;
}

export interface ParseResult {
  cleanMessage: string;
  action: ParsedAction | null;
}

/**
 * Build the system prompt for the chat assistant with issue and steps context
 */
export function buildChatSystemPrompt(
  issue: { title: string; body?: string; labels?: string[] },
  steps: AtomicStep[],
  progress: number
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

  return `You are DevFlow Assistant, an AI helper for software development workflows. You are helping a developer work on a GitHub issue.

## Current Issue
**Title:** ${issue.title}
**Description:** ${issue.body || "No description provided"}
**Labels:** ${issue.labels?.join(", ") || "None"}

## Atomic Steps (${progress}% complete)
${stepsContext || "No steps generated yet."}

## Your Capabilities
1. **Explain steps**: Describe what each step means, why it's important, and how to complete it
2. **Track progress**: Summarize what's done, what's next, and overall progress
3. **Suggest actions**: Recommend the logical next step based on current status
4. **Mark steps complete**: When the user says they completed a step, you can mark it done

## Action Commands
When the user wants to mark a step as complete, respond with the action in your message:
- Use this format at the END of your response: [[ACTION:COMPLETE_STEP:stepNumber]]
- Example: If user says "I finished writing the tests", respond helpfully AND include [[ACTION:COMPLETE_STEP:3]] (assuming step 3 is the test step)
- Only include ONE action per response
- Only mark a step complete if the user clearly indicates they finished it

## Guidelines
- Be concise but helpful
- Use the step numbers when referring to specific steps
- If asked about a step, provide context about what it involves
- When suggesting next actions, consider dependencies between steps
- Be encouraging about progress made
- If all steps are complete, congratulate the developer!
- Keep responses short - 2-3 sentences max unless explaining something complex`;
}

/**
 * Parse the AI response to extract any action commands
 */
export function parseActionFromResponse(response: string): ParseResult {
  // Pattern: [[ACTION:COMPLETE_STEP:3]]
  const actionRegex = /\[\[ACTION:COMPLETE_STEP:(\d+)\]\]/g;

  let action: ParsedAction | null = null;
  let cleanMessage = response;

  const match = actionRegex.exec(response);
  if (match) {
    const [fullMatch, stepNum] = match;
    action = {
      type: "mark_step_complete",
      stepNumber: parseInt(stepNum, 10),
    };
    cleanMessage = response.replace(fullMatch, "").trim();
  }

  return { cleanMessage, action };
}

/**
 * Get a step by its display number (1-indexed)
 */
export function getStepByNumber(steps: AtomicStep[], stepNumber: number): AtomicStep | null {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  return sorted[stepNumber - 1] || null;
}
