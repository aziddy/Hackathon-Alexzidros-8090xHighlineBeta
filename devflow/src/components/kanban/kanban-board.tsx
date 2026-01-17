"use client";

import { useState } from "react";
import { Issue, IssueStatus } from "@/types";
import { IssueListSection } from "./issue-list-section";
import { IssueDetailModal } from "@/components/issues/issue-detail-modal";

interface KanbanBoardProps {
  issues: Issue[];
  onRefresh?: () => void;
}

const sections: { id: IssueStatus; title: string; defaultOpen: boolean }[] = [
  { id: "TODO", title: "To Do", defaultOpen: true },
  { id: "IN_PROGRESS", title: "In Progress", defaultOpen: true },
  { id: "IN_REVIEW", title: "In Review", defaultOpen: true },
  { id: "DONE", title: "Done", defaultOpen: false },
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
      <div className="flex flex-col gap-4 p-6 overflow-y-auto min-h-[calc(100vh-4rem)]">
        {sections.map((section) => (
          <IssueListSection
            key={section.id}
            status={section.id}
            title={section.title}
            issues={getIssuesByStatus(section.id)}
            onIssueClick={setSelectedIssue}
            defaultOpen={section.defaultOpen}
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
