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
import { AlertTriangle, Undo2, Loader2 } from "lucide-react";

interface RevertStepDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stepName: string;
  stepDescription?: string;
  isLoading?: boolean;
}

export function RevertStepDialog({
  open,
  onClose,
  onConfirm,
  stepName,
  stepDescription,
  isLoading,
}: RevertStepDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isLoading && !isOpen && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Revert Step Completion
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            ARE YOU SURE? This will mark the step as incomplete.
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
            This action will move the step back to pending status. You will need
            to complete it again.
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
            className="bg-orange-600 hover:bg-orange-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reverting...
              </>
            ) : (
              <>
                <Undo2 className="mr-2 h-4 w-4" />
                Yes, Revert
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
