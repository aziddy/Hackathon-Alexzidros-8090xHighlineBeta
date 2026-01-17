"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckMethod } from "@/types";
import {
  RefreshCw,
  Monitor,
  CheckSquare,
  Globe,
  ChevronDown,
  Loader2,
} from "lucide-react";

interface CheckOptionsPopoverProps {
  checkMethod: CheckMethod;
  onApiCheck: () => void;
  onManualConfirm: () => void;
  onMcpInfo: () => void;
  isChecking?: boolean;
}

export function CheckOptionsPopover({
  checkMethod,
  onApiCheck,
  onManualConfirm,
  onMcpInfo,
  isChecking,
}: CheckOptionsPopoverProps) {
  const [open, setOpen] = useState(false);

  // Single action methods just show a button
  if (checkMethod === "API") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onApiCheck}
        disabled={isChecking}
        className="flex-shrink-0 border-gray-700 hover:bg-gray-700"
      >
        {isChecking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Globe className="h-4 w-4" />
        )}
        <span className="ml-2 hidden sm:inline">Check via API</span>
      </Button>
    );
  }

  if (checkMethod === "MANUAL") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onManualConfirm}
        disabled={isChecking}
        className="flex-shrink-0 border-gray-700 hover:bg-gray-700"
      >
        {isChecking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckSquare className="h-4 w-4" />
        )}
        <span className="ml-2 hidden sm:inline">Mark Complete</span>
      </Button>
    );
  }

  if (checkMethod === "MCP") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onMcpInfo}
        disabled={isChecking}
        className="flex-shrink-0 border-gray-700 hover:bg-gray-700"
      >
        <Monitor className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Run in IDE</span>
      </Button>
    );
  }

  // Multi-option methods show a popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isChecking}
          className="flex-shrink-0 border-gray-700 hover:bg-gray-700"
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Check</span>
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 bg-gray-900 border-gray-700">
        <div className="flex flex-col gap-1">
          {/* MCP Option - for MCP_OR_MANUAL and MCP_OR_API */}
          {["MCP_OR_MANUAL", "MCP_OR_API"].includes(checkMethod) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onMcpInfo();
                setOpen(false);
              }}
              className="justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Monitor className="mr-2 h-4 w-4" />
              Run in IDE
            </Button>
          )}

          {/* Manual Option - for MCP_OR_MANUAL */}
          {checkMethod === "MCP_OR_MANUAL" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onManualConfirm();
                setOpen(false);
              }}
              className="justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Mark as Complete
            </Button>
          )}

          {/* API Option - for MCP_OR_API */}
          {checkMethod === "MCP_OR_API" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onApiCheck();
                setOpen(false);
              }}
              className="justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Globe className="mr-2 h-4 w-4" />
              Check via GitHub
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
