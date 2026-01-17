"use client";

import { Issue, IssueStatus } from "@/types";
import { KanbanCard } from "./kanban-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence } from "framer-motion";

interface KanbanColumnProps {
  id: IssueStatus;
  title: string;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}

const columnColors: Record<IssueStatus, string> = {
  TODO: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-yellow-500",
  DONE: "bg-green-500",
};

export function KanbanColumn({ id, title, issues, onIssueClick }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-80 min-w-[320px] bg-gray-900/50 rounded-xl border border-gray-800">
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${columnColors[id]}`} />
          <h2 className="font-semibold text-white">{title}</h2>
        </div>
        <Badge variant="secondary" className="bg-gray-800 text-gray-400">
          {issues.length}
        </Badge>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {issues.map((issue) => (
              <KanbanCard
                key={issue.id}
                issue={issue}
                onClick={() => onIssueClick(issue)}
              />
            ))}
          </AnimatePresence>

          {issues.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No issues
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
