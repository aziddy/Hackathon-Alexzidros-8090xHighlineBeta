"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Issue, AtomicStep } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepPreviewItem } from "./step-preview-item";
import { GitPullRequest, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface WideTicketCardProps {
  issue: Issue;
  onClick: () => void;
}

function getVisibleSteps(
  steps: AtomicStep[],
  maxVisible = 5
): { visible: AtomicStep[]; remaining: number; hasInProgress: boolean } {
  const sorted = [...steps].sort((a, b) => a.order - b.order);

  // Find current in-progress step
  const inProgressIndex = sorted.findIndex((s) => s.status === "IN_PROGRESS");

  if (inProgressIndex >= 0) {
    // Show current step and upcoming steps
    const start = inProgressIndex;
    const visible = sorted.slice(start, start + maxVisible);
    return {
      visible,
      remaining: Math.max(0, sorted.length - start - visible.length),
      hasInProgress: true,
    };
  }

  // If no in-progress, find first pending step
  const firstPendingIndex = sorted.findIndex((s) => s.status === "PENDING");
  if (firstPendingIndex >= 0) {
    const visible = sorted.slice(firstPendingIndex, firstPendingIndex + maxVisible);
    return {
      visible,
      remaining: Math.max(0, sorted.length - firstPendingIndex - visible.length),
      hasInProgress: false,
    };
  }

  // All completed - show last few
  const visible = sorted.slice(-maxVisible);
  return { visible, remaining: 0, hasInProgress: false };
}

function getProgressColor(percent: number) {
  if (percent < 30) return "bg-red-500";
  if (percent < 70) return "bg-yellow-500";
  return "bg-green-500";
}

export function WideTicketCard({ issue, onClick }: WideTicketCardProps) {
  const [expanded, setExpanded] = useState(false);
  const defaultVisibleCount = 4;

  const { visible, remaining, hasInProgress } = getVisibleSteps(
    issue.atomicSteps,
    expanded ? 999 : defaultVisibleCount
  );

  const completedCount = issue.atomicSteps.filter((s) => s.status === "COMPLETED").length;
  const totalCount = issue.atomicSteps.length;

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={onClick}
        className="p-4 cursor-pointer bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800 hover:shadow-lg hover:shadow-black/20 transition-all"
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-white text-sm line-clamp-1">{issue.title}</h3>
              <span className="text-xs text-gray-500 flex-shrink-0">#{issue.githubNumber}</span>
            </div>

            {/* Labels and PR inline */}
            <div className="flex flex-wrap items-center gap-2">
              {issue.labels && issue.labels.length > 0 && (
                <>
                  {issue.labels.slice(0, 3).map((label, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs bg-gray-700 text-gray-300 py-0"
                    >
                      {label}
                    </Badge>
                  ))}
                  {issue.labels.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-400 py-0">
                      +{issue.labels.length - 3}
                    </Badge>
                  )}
                </>
              )}

              {issue.linkedPrNumber && (
                <div className="flex items-center gap-1.5 text-xs">
                  <GitPullRequest className="h-3 w-3 text-purple-400" />
                  <a
                    href={issue.linkedPrUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    PR #{issue.linkedPrNumber}
                  </a>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] py-0",
                      issue.linkedPrState === "merged"
                        ? "border-purple-500 text-purple-400"
                        : issue.linkedPrState === "open"
                        ? "border-green-500 text-green-400"
                        : "border-gray-500 text-gray-400"
                    )}
                  >
                    {issue.linkedPrState}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <a
            href={issue.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-white flex-shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Progress and Steps Container - responsive layout */}
        <div className="flex flex-col xl:flex-row xl:gap-6">
          {/* Progress Bar Section */}
          <div className="flex items-center gap-4 mb-3 pb-3 border-b border-gray-700/50 xl:border-b-0 xl:border-r xl:pr-6 xl:mb-0 xl:pb-0 xl:w-1/3 xl:flex-col xl:items-stretch xl:gap-2">
            <div className="flex-1 xl:flex-none">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">Progress</span>
                <span className="font-medium text-white">{issue.progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${issue.progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={cn("h-full rounded-full", getProgressColor(issue.progressPercent))}
                />
              </div>
            </div>
            <div className="text-xs text-gray-400 flex-shrink-0">
              {completedCount}/{totalCount} steps
            </div>
          </div>

          {/* Atomic Steps Preview */}
          <div className="xl:flex-1">
            {totalCount > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500 mb-2">
                  {hasInProgress ? "Current & upcoming steps:" : "Steps:"}
                </div>

                <AnimatePresence mode="popLayout">
                  {visible.map((step) => (
                    <motion.div
                      key={step.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <StepPreviewItem
                        step={step}
                        isHighlighted={step.status === "IN_PROGRESS"}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Expand/Collapse button */}
                {(remaining > 0 || expanded) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExpandClick}
                    className="w-full h-7 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 mt-1"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        +{remaining} more steps
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* No steps message */}
            {totalCount === 0 && (
              <div className="text-xs text-gray-500 italic">No atomic steps generated yet</div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
