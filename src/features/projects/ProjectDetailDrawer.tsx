import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Globe,
  Hash,
  Calendar,
  User,
  Database,
  RefreshCw,
  Trash2,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDateTime } from "@/lib/utils";
import { contextApi } from "@/api/context";
import { projectsApi } from "@/api/projects";
import { adminsApi } from "@/api/config";
import type { Project } from "@/types";

interface ProjectDetailDrawerProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetailDrawer({
  project,
  onClose,
}: ProjectDetailDrawerProps) {
  const queryClient = useQueryClient();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showClearContextDialog, setShowClearContextDialog] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [selectedNewOwner, setSelectedNewOwner] = useState<{
    userId: string;
    email: string;
    name?: string;
  } | null>(null);

  // Fetch context stats for this project
  const { data: contextStats, isLoading: contextLoading } = useQuery({
    queryKey: ["context-stats", project?.id],
    queryFn: () => contextApi.getStats(project!.id),
    enabled: !!project?.id,
  });

  // Search users for transfer
  const { data: searchResults } = useQuery({
    queryKey: ["users-search", transferSearch],
    queryFn: () => adminsApi.searchUsers(transferSearch),
    enabled: transferSearch.length > 2,
  });

  // Transfer ownership mutation
  const transferMutation = useMutation({
    mutationFn: (newOwnerId: string) =>
      projectsApi.transferOwnership(project!.id, newOwnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowTransferDialog(false);
      setTransferSearch("");
      setSelectedNewOwner(null);
      onClose();
    },
  });

  // Clear context mutation
  const clearContextMutation = useMutation({
    mutationFn: () => contextApi.clearContext(project!.id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context-stats", project?.id] });
      setShowClearContextDialog(false);
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.adminDelete(project!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
  });

  if (!project) return null;

  const totalContextItems =
    (contextStats?.singletons || 0) +
    (contextStats?.items || 0) +
    (contextStats?.persons || 0) +
    (contextStats?.entities || 0) +
    (contextStats?.knowledgeSources || 0);

  return (
    <>
      <div
        className="dialog-overlay"
        onClick={onClose}
      />

      <div className="dialog-content fixed inset-y-0 right-0 z-50 w-full max-w-lg text-foreground border-l border-border shadow-2xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Project Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Project Header */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                {project.name[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold truncate">{project.name}</h3>
                <p className="text-sm text-muted-foreground font-mono truncate">
                  {project.id}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.onboardingStatus && (
                    <Badge variant="secondary">{project.onboardingStatus}</Badge>
                  )}
                  {project.researchStatus && (
                    <Badge variant="secondary">{project.researchStatus}</Badge>
                  )}
                  {project.currentStep && (
                    <Badge variant="outline">{project.currentStep}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Details */}
            <div className="space-y-4">
              <h4 className="font-medium">Details</h4>
              <div className="space-y-3">
                {project.ownerEmail && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Owner</p>
                      <p>{project.ownerEmail}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Project ID</p>
                    <p className="font-mono text-sm">{project.id}</p>
                  </div>
                </div>
                {project.domain && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Domain</p>
                      <a
                        href={project.websiteUrl || `https://${project.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {project.domain}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p>{formatDateTime(project.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Updated</p>
                    <p>{formatDateTime(project.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Context Stats */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Context Data
                </h4>
                {contextStats && totalContextItems > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearContextDialog(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {contextLoading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : contextStats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-2xl font-bold">{contextStats.singletons}</p>
                    <p className="text-sm text-muted-foreground">Singletons</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-2xl font-bold">{contextStats.items}</p>
                    <p className="text-sm text-muted-foreground">Items</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-2xl font-bold">{contextStats.persons}</p>
                    <p className="text-sm text-muted-foreground">Persons</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-2xl font-bold">{contextStats.entities}</p>
                    <p className="text-sm text-muted-foreground">Entities</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 col-span-2">
                    <p className="text-2xl font-bold">{contextStats.knowledgeSources}</p>
                    <p className="text-sm text-muted-foreground">Knowledge Sources</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No context data available</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowTransferDialog(true)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Transfer Ownership
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
            </Button>
          </div>
        </div>
      </div>

      {/* Transfer Ownership Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Project Ownership</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search New Owner</label>
              <Input
                placeholder="Search by email..."
                value={transferSearch}
                onChange={(e) => {
                  setTransferSearch(e.target.value);
                  setSelectedNewOwner(null);
                }}
              />
              {searchResults?.users && searchResults.users.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {searchResults.users.map((user) => (
                    <button
                      key={user.userId}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${
                        selectedNewOwner?.userId === user.userId ? "bg-accent" : ""
                      }`}
                      onClick={() => {
                        setSelectedNewOwner(user);
                        setTransferSearch(user.email);
                      }}
                    >
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-muted-foreground text-xs">{user.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedNewOwner && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  Transfer to: <strong>{selectedNewOwner.name || selectedNewOwner.email}</strong>
                </p>
                <p className="text-xs text-muted-foreground">{selectedNewOwner.email}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedNewOwner) {
                  transferMutation.mutate(selectedNewOwner.userId);
                }
              }}
              disabled={!selectedNewOwner || transferMutation.isPending}
            >
              {transferMutation.isPending ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Context Dialog */}
      <Dialog open={showClearContextDialog} onOpenChange={setShowClearContextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Clear Project Context
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will permanently delete all context data for this project including:
            </p>
            <ul className="mt-2 text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>All singletons, items, persons, and entities</li>
              <li>All knowledge sources and uploaded files</li>
              <li>Vector store embeddings</li>
              <li>Onboarding status</li>
            </ul>
            <p className="mt-4 text-sm font-medium text-destructive">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearContextDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearContextMutation.mutate()}
              disabled={clearContextMutation.isPending}
            >
              {clearContextMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear Context"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
