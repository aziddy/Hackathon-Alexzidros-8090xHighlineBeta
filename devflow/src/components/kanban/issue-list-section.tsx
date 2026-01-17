"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Issue, IssueStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { WideTicketCard } from "./wide-ticket-card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface IssueListSectionProps {
  status: IssueStatus;
  title: string;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  defaultOpen?: boolean;
}

const statusColors: Record<IssueStatus, string> = {
  TODO: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-yellow-500",
  DONE: "bg-green-500",
};

const statusBgColors: Record<IssueStatus, string> = {
  TODO: "bg-gray-500/10 border-gray-500/30",
  IN_PROGRESS: "bg-blue-500/10 border-blue-500/30",
  IN_REVIEW: "bg-yellow-500/10 border-yellow-500/30",
  DONE: "bg-green-500/10 border-green-500/30",
};

export function IssueListSection({
  status,
  title,
  issues,
  onIssueClick,
  defaultOpen = true,
}: IssueListSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-lg border transition-all",
            "hover:bg-gray-800/50",
            statusBgColors[status]
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full", statusColors[status])} />
            <h2 className="font-semibold text-white">{title}</h2>
            <Badge variant="secondary" className="bg-gray-800 text-gray-400">
              {issues.length}
            </Badge>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </motion.div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          className="pt-3 space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {issues.length > 0 ? (
              issues.map((issue) => (
                <WideTicketCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => onIssueClick(issue)}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500"
              >
                No issues in this status
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}
