"use client";

import { useState, useEffect } from "react";
import { Issue, AtomicStep, StepStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { StepProgressBar } from "./step-progress-bar";
import { AtomicStepList } from "./atomic-step-list";
import { toast } from "sonner";
import {
  ExternalLink,
  Sparkles,
  GitPullRequest,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";

interface IssueDetailModalProps {
  issue: Issue | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (issue: Issue) => void;
}

export function IssueDetailModal({ issue, open, onClose, onUpdate }: IssueDetailModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<AtomicStep[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (issue) {
      setSteps(issue.atomicSteps);
      calculateProgress(issue.atomicSteps);
    }
  }, [issue]);

  const calculateProgress = (stepList: AtomicStep[]) => {
    if (stepList.length === 0) {
      setProgress(0);
      return;
    }
    const completed = stepList.filter((s) => s.status === "COMPLETED").length;
    const newProgress = Math.round((completed / stepList.length) * 100);

    // Trigger celebration at 100%
    if (newProgress === 100 && progress !== 100) {
      celebrateCompletion();
    }

    setProgress(newProgress);
  };

  const celebrateCompletion = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#22c55e", "#3b82f6", "#8b5cf6"],
    });
    toast.success("All steps completed! Great work! 🎉");
  };

  const handleGenerateSteps = async () => {
    if (!issue) return;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/generate-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issue.id,
          title: issue.title,
          body: issue.body,
          labels: issue.labels,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate steps");

      const data = await response.json();
      setSteps(data.steps);
      calculateProgress(data.steps);
      toast.success("Generated atomic steps with AI!");

      onUpdate({
        ...issue,
        atomicSteps: data.steps,
        progressPercent: 0,
      });
    } catch (error) {
      toast.error("Failed to generate steps. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStepUpdate = async (stepId: string, status: StepStatus) => {
    const updatedSteps = steps.map((s) =>
      s.id === stepId
        ? { ...s, status, completedAt: status === "COMPLETED" ? new Date() : undefined }
        : s
    );
    setSteps(updatedSteps);
    calculateProgress(updatedSteps);

    // Update via API
    try {
      await fetch(`/api/issues/${issue?.id}/steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (issue) {
        const newProgress = Math.round(
          (updatedSteps.filter((s) => s.status === "COMPLETED").length / updatedSteps.length) * 100
        );
        onUpdate({
          ...issue,
          atomicSteps: updatedSteps,
          progressPercent: newProgress,
        });
      }
    } catch (error) {
      toast.error("Failed to update step");
    }
  };

  const handleCheckStatus = async (stepId: string) => {
    try {
      const response = await fetch(`/api/issues/${issue?.id}/check-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId }),
      });

      if (!response.ok) throw new Error("Failed to check status");

      const data = await response.json();

      if (data.completed) {
        handleStepUpdate(stepId, "COMPLETED");
        toast.success(`Step verified: ${data.message}`);
      } else {
        toast.info(data.message || "Step not yet complete");
      }
    } catch (error) {
      toast.error("Failed to check status");
    }
  };

  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="w-[98vw] max-w-[98vw] h-[95vh] max-h-[95vh] bg-gray-900 border-gray-700 flex flex-col overflow-hidden p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-800">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <DialogTitle className="text-xl font-semibold text-white line-clamp-2">
                  {issue.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-gray-400 border-gray-600">
                    #{issue.githubNumber}
                  </Badge>
                  <a
                    href={issue.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                  >
                    View on GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Two Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">
          {/* Left Column: Issue Details */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            {/* Progress Section */}
            <div className="py-2">
              <StepProgressBar progress={progress} />
            </div>

            {/* PR Info */}
            {issue.linkedPrNumber && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-950/30 border border-purple-800">
                <GitPullRequest className="h-5 w-5 text-purple-400" />
                <div className="flex-1">
                  <a
                    href={issue.linkedPrUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    PR #{issue.linkedPrNumber}
                  </a>
                  <Badge
                    className={`ml-2 ${
                      issue.linkedPrState === "merged"
                        ? "bg-purple-600"
                        : issue.linkedPrState === "open"
                        ? "bg-green-600"
                        : "bg-gray-600"
                    }`}
                  >
                    {issue.linkedPrState}
                  </Badge>
                </div>
                {issue.pipelineStatus && (
                  <Badge
                    className={
                      issue.pipelineStatus === "success"
                        ? "bg-green-600"
                        : issue.pipelineStatus === "failure"
                        ? "bg-red-600"
                        : "bg-yellow-600"
                    }
                  >
                    {issue.pipelineStatus}
                  </Badge>
                )}
              </div>
            )}

            {/* Issue Description */}
            {issue.body && (
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{issue.body}</p>
              </div>
            )}

            {/* Labels */}
            {issue.labels && issue.labels.length > 0 && (
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Labels</h4>
                <div className="flex flex-wrap gap-2">
                  {issue.labels.map((label, i) => (
                    <Badge key={i} variant="secondary" className="bg-gray-700 text-gray-300">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Atomic Steps */}
          <div className="flex flex-col gap-4 overflow-hidden border-l border-gray-800 pl-6">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">Atomic Steps</h3>
              {steps.length === 0 ? (
                <Button
                  onClick={handleGenerateSteps}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Steps
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {steps.filter((s) => s.status === "COMPLETED").length} / {steps.length} complete
                </div>
              )}
            </div>

            <ScrollArea className="flex-1">
              <AtomicStepList
                steps={steps}
                onStepUpdate={handleStepUpdate}
                onCheckStatus={handleCheckStatus}
              />
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
