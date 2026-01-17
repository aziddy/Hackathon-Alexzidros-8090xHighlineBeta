"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FolderGit2, Plus, Loader2 } from "lucide-react";
import { Project } from "@/types";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelect: (project: Project) => void;
  onAddProject: () => void;
  isLoading?: boolean;
}

export function ProjectSelector({
  projects,
  selectedProject,
  onSelect,
  onAddProject,
  isLoading,
}: ProjectSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between border-gray-700 bg-gray-800 hover:bg-gray-700 text-left"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : selectedProject ? (
            <span className="flex items-center gap-2 truncate">
              <FolderGit2 className="h-4 w-4 text-gray-400" />
              <span className="truncate">
                {selectedProject.githubRepoOwner}/{selectedProject.githubRepoName}
              </span>
            </span>
          ) : (
            <span className="text-gray-400">Select a project</span>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-gray-800 border-gray-700" align="start">
        <DropdownMenuLabel className="text-gray-400">Your Projects</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-700" />
        {projects.length === 0 ? (
          <div className="px-2 py-4 text-center text-gray-500 text-sm">
            No projects yet. Add your first project!
          </div>
        ) : (
          projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => onSelect(project)}
              className="cursor-pointer focus:bg-gray-700 focus:text-white"
            >
              <FolderGit2 className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">
                {project.githubRepoOwner}/{project.githubRepoName}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem
          onClick={onAddProject}
          className="cursor-pointer focus:bg-gray-700 focus:text-white text-blue-400"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add new project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
