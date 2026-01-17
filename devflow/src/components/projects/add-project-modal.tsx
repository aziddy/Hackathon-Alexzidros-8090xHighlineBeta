"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FolderGit2, Loader2, Search, Star } from "lucide-react";

interface Repository {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  stargazers_count: number;
  open_issues_count: number;
}

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (repo: { owner: string; name: string }) => Promise<void>;
}

export function AddProjectModal({ open, onClose, onAdd }: AddProjectModalProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      fetchRepos();
    }
  }, [open]);

  useEffect(() => {
    if (search) {
      setFilteredRepos(
        repos.filter((repo) =>
          repo.full_name.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredRepos(repos);
    }
  }, [search, repos]);

  const fetchRepos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/github/repos");
      if (!response.ok) throw new Error("Failed to fetch repos");
      const data = await response.json();
      setRepos(data);
      setFilteredRepos(data);
    } catch (error) {
      toast.error("Failed to load repositories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (repo: Repository) => {
    setIsAdding(repo.id);
    try {
      await onAdd({ owner: repo.owner.login, name: repo.name });
      toast.success(`Added ${repo.full_name}`);
      onClose();
    } catch (error) {
      toast.error("Failed to add project");
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl w-full bg-gray-900 border-gray-700 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Add Project</DialogTitle>
          <DialogDescription className="text-gray-400">
            Select a GitHub repository to track
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <ScrollArea className="max-h-[400px] w-full overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No repositories found
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {filteredRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => handleAdd(repo)}
                  disabled={isAdding === repo.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700 border border-gray-700 transition-colors text-left disabled:opacity-50"
                >
                  <FolderGit2 className="h-5 w-5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{repo.full_name}</p>
                    {repo.description && (
                      <p className="text-sm text-gray-500 truncate">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {repo.stargazers_count}
                      </span>
                      <span>{repo.open_issues_count} issues</span>
                    </div>
                  </div>
                  {isAdding === repo.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
