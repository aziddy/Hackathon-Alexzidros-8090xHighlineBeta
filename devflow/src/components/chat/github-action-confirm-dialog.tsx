"use client";

import { GitHubActionType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GitBranch, MessageSquare, AlertCircle, Loader2 } from "lucide-react";

interface PendingGitHubAction {
  type: GitHubActionType;
  params: Record<string, unknown>;
  requiresConfirmation: boolean;
}

interface GitHubActionConfirmDialogProps {
  action: PendingGitHubAction | null;
  isExecuting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ACTION_INFO: Record<
  string,
  { title: string; description: string; icon: React.ReactNode }
> = {
  CREATE_ISSUE: {
    title: "Create Issue",
    description: "Create a new GitHub issue in this repository",
    icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  },
  ADD_COMMENT: {
    title: "Add Comment",
    description: "Add a comment to an issue or pull request",
    icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
  },
  CREATE_BRANCH: {
    title: "Create Branch",
    description: "Create a new branch in this repository",
    icon: <GitBranch className="h-5 w-5 text-green-500" />,
  },
};

function formatParams(params: Record<string, unknown>): string {
  const entries = Object.entries(params);
  return entries
    .map(([key, value]) => {
      const displayValue =
        typeof value === "string"
          ? value.length > 50
            ? value.slice(0, 50) + "..."
            : value
          : JSON.stringify(value);
      return `${key}: ${displayValue}`;
    })
    .join("\n");
}

export function GitHubActionConfirmDialog({
  action,
  isExecuting,
  onConfirm,
  onCancel,
}: GitHubActionConfirmDialogProps) {
  if (!action) return null;

  const info = ACTION_INFO[action.type] || {
    title: action.type,
    description: "Perform GitHub action",
    icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
  };

  return (
    <Dialog open={!!action} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {info.icon}
            <DialogTitle className="text-white">{info.title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            {info.description}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-800 rounded-lg p-4 text-sm font-mono text-gray-300 overflow-auto max-h-48">
          <pre className="whitespace-pre-wrap">{formatParams(action.params)}</pre>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isExecuting}
            className="border-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isExecuting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              "Execute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
