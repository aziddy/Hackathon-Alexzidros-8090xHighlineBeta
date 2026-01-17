"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Issue,
  AtomicStep,
  ChatMessage,
  StepStatus,
  GitHubActionType,
  GitHubActionResult,
} from "@/types";
import { useChatStorage } from "@/hooks/use-chat-storage";
import { ChatHeader } from "./chat-header";
import { ChatMessageComponent } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatLoading } from "./chat-loading";
import { GitHubActionConfirmDialog } from "./github-action-confirm-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStepByNumber } from "@/lib/chat-utils";
import { toast } from "sonner";

interface PendingGitHubAction {
  type: GitHubActionType;
  params: Record<string, unknown>;
  requiresConfirmation: boolean;
}

interface ChatSidebarProps {
  isOpen: boolean;
  issue: Issue;
  projectId: string;
  steps: AtomicStep[];
  progress: number;
  onStepUpdate: (stepId: string, status: StepStatus) => void;
  onClose: () => void;
}

export function ChatSidebar({
  isOpen,
  issue,
  projectId,
  steps,
  progress,
  onStepUpdate,
  onClose,
}: ChatSidebarProps) {
  const {
    messages,
    addMessage,
    clearIssueHistory,
    clearAllHistory,
    isLoaded,
  } = useChatStorage(issue.id);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingGitHubAction, setPendingGitHubAction] =
    useState<PendingGitHubAction | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const formatGitHubResult = (result: GitHubActionResult): string => {
    if (!result.success) {
      return `Error: ${result.message}`;
    }

    let formattedMessage = result.message;

    if (result.data) {
      // Format data for display
      if (result.data.issues) {
        const issues = result.data.issues as Array<{
          number: number;
          title: string;
          state: string;
        }>;
        formattedMessage +=
          "\n\n" +
          issues.map((i) => `#${i.number}: ${i.title} (${i.state})`).join("\n");
      } else if (result.data.prs) {
        const prs = result.data.prs as Array<{
          number: number;
          title: string;
          state: string;
          merged: boolean;
        }>;
        formattedMessage +=
          "\n\n" +
          prs
            .map(
              (p) =>
                `#${p.number}: ${p.title} (${p.merged ? "merged" : p.state})`
            )
            .join("\n");
      } else if (result.data.repos) {
        const repos = result.data.repos as Array<{ name: string }>;
        formattedMessage += "\n\n" + repos.map((r) => r.name).join("\n");
      } else if (result.data.runs) {
        const runs = result.data.runs as Array<{
          name: string;
          status: string;
          conclusion: string | null;
          branch: string;
        }>;
        formattedMessage +=
          "\n\n" +
          runs
            .map(
              (r) =>
                `${r.name}: ${r.conclusion || r.status} (${r.branch})`
            )
            .join("\n");
      } else if (result.data.url) {
        formattedMessage += `\n\nURL: ${result.data.url}`;
      }
    }

    return formattedMessage;
  };

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issue.id,
          projectId,
          message: content,
          issueContext: {
            title: issue.title,
            body: issue.body,
            labels: issue.labels,
            steps,
            progress,
          },
          chatHistory: messages.slice(-10),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      let displayMessage = data.message;

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: displayMessage,
        timestamp: new Date().toISOString(),
      };

      // Handle step completion action if present
      if (data.action) {
        const step = getStepByNumber(steps, data.action.stepNumber);
        if (step && step.status !== "COMPLETED") {
          onStepUpdate(step.id, "COMPLETED");
          assistantMessage.action = {
            type: data.action.type,
            stepId: step.id,
            stepName: step.name,
            executed: true,
          };
          toast.success(`Marked "${step.name}" as complete`);
        }
      }

      // Handle GitHub read action result (executed immediately)
      if (data.githubActionResult) {
        const resultText = formatGitHubResult(data.githubActionResult);
        assistantMessage.content += "\n\n" + resultText;
        assistantMessage.githubAction = {
          type: data.githubActionResult.success ? "LIST_ISSUES" : "LIST_ISSUES",
          params: {},
          executed: true,
          result: data.githubActionResult,
        };
      }

      // Handle pending GitHub write action (needs confirmation)
      if (data.githubAction?.requiresConfirmation) {
        setPendingGitHubAction(data.githubAction);
      }

      addMessage(assistantMessage);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmGitHubAction = async () => {
    if (!pendingGitHubAction) return;

    setIsExecutingAction(true);
    try {
      const response = await fetch("/api/chat/execute-github-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          actionType: pendingGitHubAction.type,
          params: pendingGitHubAction.params,
        }),
      });

      const result: GitHubActionResult = await response.json();

      // Add result message to chat
      const resultMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: formatGitHubResult(result),
        timestamp: new Date().toISOString(),
        githubAction: {
          type: pendingGitHubAction.type,
          params: pendingGitHubAction.params,
          executed: true,
          result,
        },
      };
      addMessage(resultMessage);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error executing GitHub action:", error);
      toast.error("Failed to execute GitHub action");
    } finally {
      setIsExecutingAction(false);
      setPendingGitHubAction(null);
    }
  };

  const handleCancelGitHubAction = () => {
    setPendingGitHubAction(null);
    toast.info("Action cancelled");
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute left-0 top-0 bottom-0 w-80 bg-gray-900 border-r border-gray-700 flex flex-col z-10"
          >
            <ChatHeader
              onClearIssue={clearIssueHistory}
              onClearAll={clearAllHistory}
              onClose={onClose}
            />

            <ScrollArea className="flex-1 min-h-0 p-4 overflow-hidden">
              <div ref={scrollRef} className="space-y-4 w-full overflow-hidden">
                {!isLoaded ? (
                  <div className="text-gray-500 text-center py-8">
                    Loading...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    <p className="mb-2">Ask me about this issue!</p>
                    <p className="text-xs text-gray-600">
                      I can explain steps, suggest next actions, perform GitHub
                      operations, or mark steps complete.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <ChatMessageComponent key={msg.id} message={msg} />
                  ))
                )}
                {isLoading && <ChatLoading />}
              </div>
            </ScrollArea>

            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>

      <GitHubActionConfirmDialog
        action={pendingGitHubAction}
        isExecuting={isExecutingAction}
        onConfirm={handleConfirmGitHubAction}
        onCancel={handleCancelGitHubAction}
      />
    </>
  );
}
