"use client";

import { useState } from "react";
import { AtomicStep, StepStatus } from "@/types";
import { AtomicStepItem } from "./atomic-step-item";
import { AnimatePresence, motion } from "framer-motion";

type CheckAction = "api_check" | "manual_confirm" | "mcp_info";

interface AtomicStepListProps {
  steps: AtomicStep[];
  onStepUpdate: (stepId: string, status: StepStatus) => void;
  onCheckStatus: (stepId: string, action: CheckAction) => Promise<void>;
}

export function AtomicStepList({ steps, onStepUpdate, onCheckStatus }: AtomicStepListProps) {
  const [checkingStepId, setCheckingStepId] = useState<string | null>(null);

  const handleCheckStatus = async (stepId: string, action: CheckAction) => {
    setCheckingStepId(stepId);
    try {
      await onCheckStatus(stepId, action);
    } finally {
      setCheckingStepId(null);
    }
  };

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  return (
    <div className="relative">
      <AnimatePresence mode="popLayout">
        {sortedSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <AtomicStepItem
              step={step}
              stepNumber={index + 1}
              isLast={index === sortedSteps.length - 1}
              onToggle={onStepUpdate}
              onCheckStatus={handleCheckStatus}
              isChecking={checkingStepId === step.id}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {steps.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No atomic steps yet.</p>
          <p className="text-sm mt-2">Click &quot;Generate Steps&quot; to create them with AI</p>
        </div>
      )}
    </div>
  );
}
