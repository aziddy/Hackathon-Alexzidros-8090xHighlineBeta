"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { ProjectSelector } from "@/components/projects/project-selector";
import { AddProjectModal } from "@/components/projects/add-project-modal";
import { Project, Issue } from "@/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Wrapper component to read search params (needs to be inside Suspense)
function KanbanBoardWrapper({ issues, onRefresh }: { issues: Issue[]; onRefresh: () => void }) {
  const searchParams = useSearchParams();
  const initialIssueId = searchParams.get("issue");

  return <KanbanBoard issues={issues} onRefresh={onRefresh} initialIssueId={initialIssueId} />;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch issues when project changes
  useEffect(() => {
    if (selectedProject) {
      fetchIssues(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIssues = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/issues`);
      if (!response.ok) throw new Error("Failed to fetch issues");
      const data = await response.json();
      setIssues(data);
    } catch (error) {
      toast.error("Failed to load issues");
    }
  };

  const handleSync = async () => {
    if (!selectedProject) return;
    setIsSyncing(true);

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/sync`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to sync");

      await fetchIssues(selectedProject.id);
      toast.success("Synced with GitHub!");
    } catch (error) {
      toast.error("Failed to sync with GitHub");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddProject = async (repo: { owner: string; name: string }) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        githubRepoOwner: repo.owner,
        githubRepoName: repo.name,
        name: `${repo.owner}/${repo.name}`,
      }),
    });

    if (!response.ok) throw new Error("Failed to add project");

    const newProject = await response.json();
    setProjects((prev) => [...prev, newProject]);
    setSelectedProject(newProject);
    setShowAddProject(false);

    // Sync issues immediately
    setIsSyncing(true);
    try {
      await fetch(`/api/projects/${newProject.id}/sync`, { method: "POST" });
      await fetchIssues(newProject.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    if (selectedProject) {
      fetchIssues(selectedProject.id);
    }
  }, [selectedProject]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        onSync={selectedProject ? handleSync : undefined}
        isSyncing={isSyncing}
      />

      <div className="p-6 border-b border-gray-800">
        <div className="max-w-xs">
          <ProjectSelector
            projects={projects}
            selectedProject={selectedProject}
            onSelect={setSelectedProject}
            onAddProject={() => setShowAddProject(true)}
          />
        </div>
      </div>

      {selectedProject ? (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}>
          <KanbanBoardWrapper issues={issues} onRefresh={handleRefresh} />
        </Suspense>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">No Project Selected</h2>
            <p className="text-gray-400 mb-4">Add a GitHub repository to get started</p>
            <button
              onClick={() => setShowAddProject(true)}
              className="text-blue-400 hover:text-blue-300"
            >
              Add your first project
            </button>
          </div>
        </div>
      )}

      <AddProjectModal
        open={showAddProject}
        onClose={() => setShowAddProject(false)}
        onAdd={handleAddProject}
      />
    </div>
  );
}
