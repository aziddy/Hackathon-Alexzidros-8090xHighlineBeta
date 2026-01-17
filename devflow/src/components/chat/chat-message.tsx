"use client";

import { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { User, Bot, CheckCircle } from "lucide-react";

interface ChatMessageComponentProps {
  message: ChatMessage;
}

export function ChatMessageComponent({ message }: ChatMessageComponentProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 w-full overflow-hidden", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-600" : "bg-purple-600"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      <div className={cn("flex-1 min-w-0 space-y-1 overflow-hidden", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "px-4 py-2 rounded-lg text-sm break-all",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-200 border border-gray-700"
          )}
        >
          {message.content}
        </div>

        {message.action?.executed && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle className="h-3 w-3" />
            Marked &quot;{message.action.stepName}&quot; as complete
          </div>
        )}

        <div className="text-xs text-gray-500">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
