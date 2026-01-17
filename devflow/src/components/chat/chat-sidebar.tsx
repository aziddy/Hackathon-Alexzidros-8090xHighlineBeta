"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Issue, AtomicStep, ChatMessage, StepStatus } from "@/types";
import { useChatStorage } from "@/hooks/use-chat-storage";
import { ChatHeader } from "./chat-header";
import { ChatMessageComponent } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatLoading } from "./chat-loading";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseActionFromResponse, getStepByNumber } from "@/lib/chat-utils";
import { toast } from "sonner";

interface ChatSidebarProps {
  isOpen: boolean;
  issue: Issue;
  steps: AtomicStep[];
  progress: number;
  onStepUpdate: (stepId: string, status: StepStatus) => void;
  onClose: () => void;
}

export function ChatSidebar({
  isOpen,
  issue,
  steps,
  progress,
  onStepUpdate,
  onClose,
}: ChatSidebarProps) {
  const {
    messages,
    addMessage,
    updateMessage,
    clearIssueHistory,
    clearAllHistory,
    isLoaded,
  } = useChatStorage(issue.id);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
      const { cleanMessage, action } = parseActionFromResponse(data.message);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: cleanMessage,
        timestamp: new Date().toISOString(),
      };

      // Handle action if present
      if (action) {
        const step = getStepByNumber(steps, action.stepNumber);
        if (step && step.status !== "COMPLETED") {
          onStepUpdate(step.id, "COMPLETED");
          assistantMessage.action = {
            type: action.type,
            stepId: step.id,
            stepName: step.name,
            executed: true,
          };
          toast.success(`Marked "${step.name}" as complete`);
        }
      }

      addMessage(assistantMessage);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

          <ScrollArea className="flex-1 min-h-0 p-4">
            <div ref={scrollRef} className="space-y-4">
              {!isLoaded ? (
                <div className="text-gray-500 text-center py-8">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <p className="mb-2">Ask me about this issue!</p>
                  <p className="text-xs text-gray-600">
                    I can explain steps, suggest next actions, or mark steps complete.
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
  );
}
