"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Issue, IssueStatus } from "@/types";
import { IssueListSection } from "./issue-list-section";
import { IssueDetailModal } from "@/components/issues/issue-detail-modal";

interface KanbanBoardProps {
  issues: Issue[];
  onRefresh?: () => void;
  initialIssueId?: string | null;
}

const sections: { id: IssueStatus; title: string; defaultOpen: boolean }[] = [
  { id: "TODO", title: "To Do", defaultOpen: true },
  { id: "IN_PROGRESS", title: "In Progress", defaultOpen: true },
  { id: "IN_REVIEW", title: "In Review", defaultOpen: true },
  { id: "DONE", title: "Done", defaultOpen: false },
];

export function KanbanBoard({ issues, onRefresh, initialIssueId }: KanbanBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Initialize from URL on mount or when issues load
  useEffect(() => {
    if (initialIssueId && issues.length > 0 && !selectedIssue) {
      const issue = issues.find(i => i.id === initialIssueId);
      if (issue) {
        setSelectedIssue(issue);
      }
    }
  }, [initialIssueId, issues, selectedIssue]);

  // Handle browser back/forward
  useEffect(() => {
    const currentIssueId = searchParams.get("issue");

    if (currentIssueId && !selectedIssue) {
      const issue = issues.find(i => i.id === currentIssueId);
      if (issue) setSelectedIssue(issue);
    } else if (!currentIssueId && selectedIssue) {
      setSelectedIssue(null);
    }
  }, [searchParams, issues, selectedIssue]);

  const getIssuesByStatus = (status: IssueStatus): Issue[] => {
    return issues.filter((issue) => issue.status === status);
  };

  // Open issue and update URL
  const handleIssueClick = useCallback((issue: Issue) => {
    setSelectedIssue(issue);

    const params = new URLSearchParams(searchParams.toString());
    params.set("issue", issue.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Close dialog and clear URL
  const handleClose = useCallback(() => {
    setSelectedIssue(null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("issue");
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [router, pathname, searchParams]);

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
            onIssueClick={handleIssueClick}
            defaultOpen={section.defaultOpen}
          />
        ))}
      </div>

      <IssueDetailModal
        issue={selectedIssue}
        open={!!selectedIssue}
        onClose={handleClose}
        onUpdate={handleIssueUpdate}
      />
    </>
  );
}
