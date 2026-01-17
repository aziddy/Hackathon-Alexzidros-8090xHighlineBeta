export type IssueStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

export type StepType =
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

export interface AtomicStep {
  id: string;
  name: string;
  description?: string;
  type: StepType;
  order: number;
  status: StepStatus;
  completedAt?: Date;
  verifiedVia?: string;
  metadata?: string;
}

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
