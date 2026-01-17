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
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ManualConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stepName: string;
  stepDescription?: string;
  isLoading?: boolean;
}

export function ManualConfirmDialog({
  open,
  onClose,
  onConfirm,
  stepName,
  stepDescription,
  isLoading,
}: ManualConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isLoading && !isOpen && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Confirm Step Completion
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Are you sure you want to mark this step as complete?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h4 className="font-medium text-white">{stepName}</h4>
            {stepDescription && (
              <p className="text-sm text-gray-400 mt-1">{stepDescription}</p>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            This step requires manual verification. Please ensure you have completed
            all necessary work before confirming.
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
            className="bg-green-600 hover:bg-green-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Complete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
