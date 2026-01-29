"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AtomicStep, StepType, StepStatus, CheckMethod, STEP_CONFIG, CHECK_METHOD_LABELS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { CheckOptionsPopover } from "./check-options-popover";
import { ManualConfirmDialog } from "./manual-confirm-dialog";
import { RevertStepDialog } from "./revert-step-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  Monitor,
  Download,
} from "lucide-react";

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

const STATUS_COLORS: Record<StepStatus, string> = {
  PENDING: "bg-gray-700 text-gray-400",
  IN_PROGRESS: "bg-blue-900 text-blue-400 border-blue-500",
  COMPLETED: "bg-green-900 text-green-400 border-green-500",
  BLOCKED: "bg-red-900 text-red-400 border-red-500",
  SKIPPED: "bg-gray-800 text-gray-500",
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

type CheckAction = "api_check" | "manual_confirm" | "mcp_info";

interface AtomicStepItemProps {
  step: AtomicStep;
  stepNumber?: number;
  isLast?: boolean;
  onToggle: (stepId: string, status: StepStatus) => void;
  onCheckStatus: (stepId: string, action: CheckAction) => Promise<void>;
  isChecking?: boolean;
}

export function AtomicStepItem({
  step,
  stepNumber,
  isLast,
  onToggle,
  onCheckStatus,
  isChecking,
}: AtomicStepItemProps) {
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [showMcpInfo, setShowMcpInfo] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const Icon = ICONS[step.type];
  const config = STEP_CONFIG[step.type];
  const isCompleted = step.status === "COMPLETED";
  const isInProgress = step.status === "IN_PROGRESS";

  const handleToggle = () => {
    if (isCompleted) {
      // Show confirmation dialog before reverting
      setShowRevertConfirm(true);
    } else {
      onToggle(step.id, "COMPLETED");
    }
  };

  const confirmRevert = () => {
    onToggle(step.id, "PENDING");
    setShowRevertConfirm(false);
  };

  const handleApiCheck = () => onCheckStatus(step.id, "api_check");

  const handleManualConfirm = () => setShowManualConfirm(true);

  const handleMcpInfo = () => setShowMcpInfo(true);

  const confirmManual = async () => {
    await onCheckStatus(step.id, "manual_confirm");
    setShowManualConfirm(false);
  };

  // Default to MCP_OR_MANUAL if checkMethod is not set
  const checkMethod: CheckMethod = step.checkMethod || "MCP_OR_MANUAL";

  return (
    <>
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
            <div className="flex items-center gap-2 flex-wrap">
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
              {/* Check method indicator */}
              <Badge
                variant="outline"
                className="text-xs bg-gray-800 text-gray-400 border-gray-600"
              >
                {CHECK_METHOD_LABELS[checkMethod]}
              </Badge>
            </div>
            {step.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                {step.description}
              </p>
            )}
            {step.verifiedVia && (
              <p className="text-xs text-gray-600 mt-1">
                Verified via: {step.verifiedVia}
              </p>
            )}
          </div>

          {/* Check Options */}
          {!isCompleted && (
            <CheckOptionsPopover
              checkMethod={checkMethod}
              onApiCheck={handleApiCheck}
              onManualConfirm={handleManualConfirm}
              onMcpInfo={handleMcpInfo}
              isChecking={isChecking}
            />
          )}
        </motion.div>
      </div>

      {/* Manual Confirmation Dialog */}
      <ManualConfirmDialog
        open={showManualConfirm}
        onClose={() => setShowManualConfirm(false)}
        onConfirm={confirmManual}
        stepName={step.name}
        stepDescription={step.description}
        isLoading={isChecking}
      />

      {/* MCP Info Dialog */}
      <Dialog open={showMcpInfo} onOpenChange={setShowMcpInfo}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-400" />
              Run in IDE
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This step can be completed and verified through your IDE.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-300">
              This step can be completed and verified through your IDE using the
              DevFlow MCP extension.
            </p>
            <div className="mt-4 p-3 bg-gray-800 rounded-lg font-mono text-sm text-gray-300">
              <p>
                <span className="text-gray-500">Step:</span> {step.name}
              </p>
              <p>
                <span className="text-gray-500">Type:</span> {step.type}
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              When you complete this step in your IDE, it will automatically be
              marked as complete in DevFlow.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowMcpInfo(false)}
              className="border-gray-700"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revert Step Confirmation Dialog */}
      <RevertStepDialog
        open={showRevertConfirm}
        onClose={() => setShowRevertConfirm(false)}
        onConfirm={confirmRevert}
        stepName={step.name}
        stepDescription={step.description}
      />
    </>
  );
}
