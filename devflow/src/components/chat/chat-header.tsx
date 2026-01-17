"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, MoreVertical, Trash2, X } from "lucide-react";

interface ChatHeaderProps {
  onClearIssue: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function ChatHeader({ onClearIssue, onClearAll, onClose }: ChatHeaderProps) {
  return (
    <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-purple-400" />
        <h3 className="font-semibold text-white">DevFlow Assistant</h3>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
            <DropdownMenuItem
              onClick={onClearIssue}
              className="text-gray-300 focus:bg-gray-700 focus:text-white cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear this chat
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem
              onClick={onClearAll}
              className="text-red-400 focus:bg-gray-700 focus:text-red-300 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all chats
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
