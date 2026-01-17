"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface DeleteStepsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stepCount: number;
  isLoading?: boolean;
}

export function DeleteStepsDialog({
  open,
  onClose,
  onConfirm,
  stepCount,
  isLoading,
}: DeleteStepsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isLoading && !isOpen && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete All Steps
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Are you sure you want to delete all atomic steps?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 rounded-lg bg-red-950/30 border border-red-800">
            <p className="text-sm text-red-300">
              This will permanently delete <span className="font-bold">{stepCount}</span> step{stepCount !== 1 ? "s" : ""} from this ticket.
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            This action cannot be undone. You can regenerate steps using the AI button after deletion.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
