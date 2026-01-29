export type IssueStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

export type StepType =
  | "CREATE_BRANCH"
  | "PULL_BRANCH"
  | "CODE"
  | "TEST"
  | "RUN_TESTS"
  | "COMMIT"
  | "CREATE_PR"
  | "REQUEST_REVIEW"
  | "ADDRESS_COMMENTS"
  | "GET_APPROVAL"
  | "MERGE"
  | "DEPLOY"
  | "CLOSE_ISSUE"
  | "CUSTOM";

export type StepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "SKIPPED";

export type CheckMethod =
  | "MCP_OR_MANUAL" // Verified via IDE or manual confirmation
  | "MCP"           // Only verifiable via IDE
  | "MANUAL"        // Only manual confirmation
  | "MCP_OR_API"    // Via IDE or GitHub API
  | "API";          // Only GitHub API

export interface AtomicStep {
  id: string;
  name: string;
  description?: string;
  type: StepType;
  checkMethod: CheckMethod;
  order: number;
  status: StepStatus;
  completedAt?: Date;
  verifiedVia?: string;
  metadata?: string;
}

// Default check method mapping for each step type
export const DEFAULT_CHECK_METHOD: Record<StepType, CheckMethod> = {
  CREATE_BRANCH: "API",           // Always create via GitHub API to enable linking
  PULL_BRANCH: "MCP_OR_MANUAL",   // Pull/checkout the remote branch locally
  CODE: "MCP_OR_MANUAL",
  TEST: "MCP_OR_MANUAL",
  RUN_TESTS: "MCP_OR_MANUAL",
  COMMIT: "MCP_OR_MANUAL",
  CREATE_PR: "API",
  REQUEST_REVIEW: "API",
  ADDRESS_COMMENTS: "MCP_OR_MANUAL",
  GET_APPROVAL: "API",
  MERGE: "API",
  DEPLOY: "MCP_OR_API",
  CLOSE_ISSUE: "API",
  CUSTOM: "MANUAL",
};

// Human-readable labels for check methods
export const CHECK_METHOD_LABELS: Record<CheckMethod, string> = {
  MCP_OR_MANUAL: "IDE/Manual",
  MCP: "IDE Only",
  MANUAL: "Manual",
  MCP_OR_API: "IDE/API",
  API: "Auto-check",
};

export interface Issue {
  id: string;
  title: string;
  body?: string;
  githubIssueId: string;
  githubNumber: number;
  githubUrl: string;
  status: IssueStatus;
  labels?: string[];
  assignees?: string[];
  progressPercent: number;
  linkedPrNumber?: number;
  linkedPrUrl?: string;
  linkedPrState?: string;
  pipelineStatus?: string;
  metadata?: string | null;
  atomicSteps: AtomicStep[];
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  githubRepoOwner: string;
  githubRepoName: string;
  lastSyncedAt?: Date;
  issues: Issue[];
}

export interface KanbanColumn {
  id: IssueStatus;
  title: string;
  issues: Issue[];
}

// Step type configuration
export const STEP_CONFIG: Record<StepType, { label: string; icon: string; color: string }> = {
  CREATE_BRANCH: { label: "Create Branch", icon: "GitBranch", color: "teal" },
  PULL_BRANCH: { label: "Pull Branch", icon: "Download", color: "cyan" },
  CODE: { label: "Write Code", icon: "Code", color: "blue" },
  TEST: { label: "Write Tests", icon: "FlaskConical", color: "purple" },
  RUN_TESTS: { label: "Run Tests", icon: "Play", color: "green" },
  COMMIT: { label: "Commit", icon: "GitCommit", color: "orange" },
  CREATE_PR: { label: "Create PR", icon: "GitPullRequest", color: "cyan" },
  REQUEST_REVIEW: { label: "Request Review", icon: "Users", color: "yellow" },
  ADDRESS_COMMENTS: { label: "Address Comments", icon: "MessageSquare", color: "pink" },
  GET_APPROVAL: { label: "Get Approval", icon: "CheckCircle", color: "green" },
  MERGE: { label: "Merge", icon: "GitMerge", color: "purple" },
  DEPLOY: { label: "Deploy", icon: "Rocket", color: "red" },
  CLOSE_ISSUE: { label: "Close Issue", icon: "CheckSquare", color: "green" },
  CUSTOM: { label: "Custom", icon: "Circle", color: "gray" },
};

// Chat types
export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  action?: {
    type: "mark_step_complete";
    stepId: string;
    stepName: string;
    executed: boolean;
  };
  githubAction?: GitHubAction;
}

export interface ChatStorage {
  version: number;
  chats: Record<string, ChatMessage[]>;
}

// GitHub Action Types for AI Chat
export type GitHubActionType =
  | "CREATE_ISSUE"
  | "ADD_COMMENT"
  | "CREATE_BRANCH"
  | "CREATE_PR"
  | "LINK_BRANCH"
  | "LIST_REPOS"
  | "LIST_ISSUES"
  | "LIST_PRS"
  | "CHECK_WORKFLOW"
  | "GET_LINKED_BRANCHES"
  | "LIST_BRANCHES";

export interface GitHubActionPayload {
  type: GitHubActionType;
  params: Record<string, unknown>;
  requiresConfirmation: boolean;
}

export interface GitHubActionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface GitHubAction {
  type: GitHubActionType;
  params: Record<string, unknown>;
  executed: boolean;
  result?: GitHubActionResult;
  pendingConfirmation?: boolean;
}

export interface BranchMetadata {
  name: string;
  createdAt: string;
  linkedAt?: string;
  baseBranch: string;
  note?: string;
}

export interface IssueMetadata {
  branch?: BranchMetadata;
  // Extensible for future metadata
}
