"use client";

import { useState } from "react";
import { Issue, IssueStatus, KanbanColumn as KanbanColumnType } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { IssueDetailModal } from "@/components/issues/issue-detail-modal";

interface KanbanBoardProps {
  issues: Issue[];
  onRefresh?: () => void;
}

const columns: { id: IssueStatus; title: string }[] = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "In Review" },
  { id: "DONE", title: "Done" },
];

export function KanbanBoard({ issues, onRefresh }: KanbanBoardProps) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const getIssuesByStatus = (status: IssueStatus): Issue[] => {
    return issues.filter((issue) => issue.status === status);
  };

  const handleIssueUpdate = (updatedIssue: Issue) => {
    // Update would go through API, then refresh
    setSelectedIssue(updatedIssue);
    onRefresh?.();
  };

  return (
    <>
      <div className="flex gap-4 p-6 overflow-x-auto min-h-[calc(100vh-4rem)]">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            issues={getIssuesByStatus(column.id)}
            onIssueClick={setSelectedIssue}
          />
        ))}
      </div>

      <IssueDetailModal
        issue={selectedIssue}
        open={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onUpdate={handleIssueUpdate}
      />
    </>
  );
}
