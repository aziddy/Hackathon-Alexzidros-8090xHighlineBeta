"use client";

import { motion } from "framer-motion";
import { Issue } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GitPullRequest, ExternalLink } from "lucide-react";

interface KanbanCardProps {
  issue: Issue;
  onClick: () => void;
}

export function KanbanCard({ issue, onClick }: KanbanCardProps) {
  const getProgressColor = (percent: number) => {
    if (percent < 30) return "bg-red-500";
    if (percent < 70) return "bg-yellow-500";
    return "bg-green-500";
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
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white text-sm line-clamp-2 mb-1">
              {issue.title}
            </h3>
            <span className="text-xs text-gray-500">#{issue.githubNumber}</span>
          </div>
          <a
            href={issue.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-white ml-2 flex-shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Labels */}
        {issue.labels && issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {issue.labels.slice(0, 3).map((label, i) => (
              <Badge key={i} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                {label}
              </Badge>
            ))}
            {issue.labels.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-400">
                +{issue.labels.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* PR Link */}
        {issue.linkedPrNumber && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <GitPullRequest className="h-3.5 w-3.5 text-purple-400" />
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
              className={`text-xs ${
                issue.linkedPrState === "merged"
                  ? "border-purple-500 text-purple-400"
                  : issue.linkedPrState === "open"
                  ? "border-green-500 text-green-400"
                  : "border-gray-500 text-gray-400"
              }`}
            >
              {issue.linkedPrState}
            </Badge>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Progress</span>
            <span className="font-medium text-white">{issue.progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${issue.progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${getProgressColor(issue.progressPercent)}`}
            />
          </div>
          <div className="text-xs text-gray-500">
            {issue.atomicSteps.filter((s) => s.status === "COMPLETED").length}/{issue.atomicSteps.length} steps
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
