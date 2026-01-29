"use client";

import { AtomicStep, StepType, StepStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  FlaskConical,
  Play,
  GitCommit,
  GitPullRequest,
  GitBranch,
  Users,
  MessageSquare,
  CheckCircle,
  GitMerge,
  Rocket,
  CheckSquare,
  Circle,
  Check,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<StepType, React.ElementType> = {
  CREATE_BRANCH: GitBranch,
  PULL_BRANCH: Download,
  CODE: Code,
  TEST: FlaskConical,
  RUN_TESTS: Play,
  COMMIT: GitCommit,
  CREATE_PR: GitPullRequest,
  REQUEST_REVIEW: Users,
  ADDRESS_COMMENTS: MessageSquare,
  GET_APPROVAL: CheckCircle,
  MERGE: GitMerge,
  DEPLOY: Rocket,
  CLOSE_ISSUE: CheckSquare,
  CUSTOM: Circle,
};

const STATUS_BADGE_COLORS: Record<StepStatus, string> = {
  PENDING: "bg-gray-700/50 text-gray-400 border-gray-600",
  IN_PROGRESS: "bg-blue-900/50 text-blue-400 border-blue-500",
  COMPLETED: "bg-green-900/50 text-green-400 border-green-500",
  BLOCKED: "bg-red-900/50 text-red-400 border-red-500",
  SKIPPED: "bg-gray-800/50 text-gray-500 border-gray-600",
};

const TYPE_COLORS: Record<StepType, string> = {
  CREATE_BRANCH: "bg-teal-600",
  PULL_BRANCH: "bg-cyan-600",
  CODE: "bg-blue-600",
  TEST: "bg-emerald-500",
  RUN_TESTS: "bg-green-700",
  COMMIT: "bg-purple-400",
  CREATE_PR: "bg-purple-700",
  REQUEST_REVIEW: "bg-gradient-to-r from-purple-500 to-orange-500",
  ADDRESS_COMMENTS: "bg-gradient-to-r from-purple-500 to-blue-500",
  GET_APPROVAL: "bg-gradient-to-r from-purple-500 to-green-500",
  MERGE: "bg-blue-500",
  DEPLOY: "bg-orange-500",
  CLOSE_ISSUE: "bg-green-500",
  CUSTOM: "bg-gray-600",
};

interface StepPreviewItemProps {
  step: AtomicStep;
  isHighlighted?: boolean;
}

export function StepPreviewItem({ step, isHighlighted }: StepPreviewItemProps) {
  const Icon = ICONS[step.type];
  const isCompleted = step.status === "COMPLETED";
  const isInProgress = step.status === "IN_PROGRESS";

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded text-sm transition-colors",
        isHighlighted && "bg-blue-900/30 border-l-2 border-blue-500 pl-3",
        isCompleted && "opacity-60"
      )}
    >
      {/* Step number */}
      <span
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold",
          isCompleted
            ? "bg-green-900/50 text-green-400"
            : isInProgress
            ? "bg-blue-900/50 text-blue-400"
            : "bg-gray-700/50 text-gray-400"
        )}
      >
        {step.order}
      </span>

      {/* Checkbox indicator */}
      <div
        className={cn(
          "w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center",
          isCompleted
            ? "bg-green-500 border-green-500"
            : step.status === "IN_PROGRESS"
            ? "border-blue-500 bg-blue-500/20"
            : "border-gray-600"
        )}
      >
        {isCompleted && <Check className="h-2.5 w-2.5 text-white" />}
        {step.status === "IN_PROGRESS" && (
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        )}
      </div>

      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 p-1 rounded",
          isCompleted ? "bg-green-900/50 opacity-60" : TYPE_COLORS[step.type]
        )}
      >
        <Icon className="h-3 w-3 text-white" />
      </div>

      {/* Step name */}
      <span
        className={cn(
          "flex-1 truncate",
          isCompleted && "line-through text-gray-500",
          !isCompleted && "text-gray-300"
        )}
      >
        {step.name}
      </span>

      {/* Status badge */}
      <Badge
        variant="outline"
        className={cn("text-[10px] px-1.5 py-0 h-4", STATUS_BADGE_COLORS[step.status])}
      >
        {step.status === "IN_PROGRESS" ? "active" : step.status.toLowerCase()}
      </Badge>
    </div>
  );
}
