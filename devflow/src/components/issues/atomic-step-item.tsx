"use client";

import { motion } from "framer-motion";
import { AtomicStep, StepType, StepStatus, STEP_CONFIG } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  FlaskConical,
  Play,
  GitCommit,
  GitPullRequest,
  Users,
  MessageSquare,
  CheckCircle,
  GitMerge,
  Rocket,
  CheckSquare,
  Circle,
  RefreshCw,
  Check,
  Loader2,
} from "lucide-react";

const ICONS: Record<StepType, React.ElementType> = {
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

const STATUS_COLORS: Record<StepStatus, string> = {
  PENDING: "bg-gray-700 text-gray-400",
  IN_PROGRESS: "bg-blue-900 text-blue-400 border-blue-500",
  COMPLETED: "bg-green-900 text-green-400 border-green-500",
  BLOCKED: "bg-red-900 text-red-400 border-red-500",
  SKIPPED: "bg-gray-800 text-gray-500",
};

const TYPE_COLORS: Record<StepType, string> = {
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

interface AtomicStepItemProps {
  step: AtomicStep;
  stepNumber?: number;
  isLast?: boolean;
  onToggle: (stepId: string, status: StepStatus) => void;
  onCheckStatus: (stepId: string) => void;
  isChecking?: boolean;
}

export function AtomicStepItem({ step, stepNumber, isLast, onToggle, onCheckStatus, isChecking }: AtomicStepItemProps) {
  const Icon = ICONS[step.type];
  const config = STEP_CONFIG[step.type];
  const isCompleted = step.status === "COMPLETED";
  const isInProgress = step.status === "IN_PROGRESS";

  const handleToggle = () => {
    const newStatus: StepStatus = isCompleted ? "PENDING" : "COMPLETED";
    onToggle(step.id, newStatus);
  };

  return (
    <div className="flex gap-4">
      {/* Vertical Progress Indicator */}
      {stepNumber !== undefined && (
        <div className="flex flex-col items-center">
          {/* Step Number Circle */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              isCompleted
                ? "bg-green-500 text-white"
                : isInProgress
                ? "bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
          </div>
          {/* Vertical Line */}
          {!isLast && (
            <div
              className={`w-0.5 flex-1 min-h-[24px] mt-2 ${
                isCompleted ? "bg-green-500" : "bg-gray-700"
              }`}
            />
          )}
        </div>
      )}

      {/* Main Content */}
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex-1 flex items-center gap-4 p-4 rounded-lg border transition-all mb-3 ${
          isCompleted
            ? "bg-green-950/30 border-green-800"
            : isInProgress
            ? "bg-blue-950/30 border-blue-700"
            : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
        }`}
      >
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? "bg-green-500 border-green-500"
              : "border-gray-600 hover:border-gray-400"
          }`}
        >
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Check className="h-4 w-4 text-white" />
            </motion.div>
          )}
        </button>

        {/* Icon */}
        <div
          className={`flex-shrink-0 p-2 rounded-lg ${
            isCompleted ? "bg-green-900/50 opacity-60" : TYPE_COLORS[step.type]
          }`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`font-medium ${
                isCompleted ? "text-green-300 line-through" : "text-white"
              }`}
            >
              {step.name}
            </h4>
            <Badge variant="outline" className={STATUS_COLORS[step.status]}>
              {step.status.toLowerCase().replace("_", " ")}
            </Badge>
          </div>
          {step.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{step.description}</p>
          )}
          {step.verifiedVia && (
            <p className="text-xs text-gray-600 mt-1">
              Verified via: {step.verifiedVia}
            </p>
          )}
        </div>

        {/* Check Status Button */}
        {!isCompleted && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCheckStatus(step.id)}
            disabled={isChecking}
            className="flex-shrink-0 border-gray-700 hover:bg-gray-700"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Check</span>
          </Button>
        )}
      </motion.div>
    </div>
  );
}
