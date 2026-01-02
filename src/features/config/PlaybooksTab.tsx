import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, RefreshCw, Trash2, Pencil, Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
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
import { playbooksApi } from "@/api/config";
import type { Playbook } from "@/types";

interface PlaybookForm {
  skillId: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  tags: string;
  autoActions: string;
  artifacts: string;
}

const emptyForm: PlaybookForm = {
  skillId: "",
  name: "",
  description: "",
  category: "builder",
  difficulty: "intermediate",
  tags: "",
  autoActions: "",
  artifacts: "",
};

export function PlaybooksTab() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
  const [form, setForm] = useState<PlaybookForm>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["config", "playbooks"],
    queryFn: () => playbooksApi.list(),
  });

  const syncMutation = useMutation({
    mutationFn: () => playbooksApi.syncFromSkills(false),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["config", "playbooks"] });
      alert(
        `Sync complete: created ${result.created}, updated ${result.updated}, skipped ${result.skipped}`
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Playbook>) => playbooksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "playbooks"] });
      setShowCreateDialog(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Playbook> }) =>
      playbooksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "playbooks"] });
      setEditingPlaybook(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => playbooksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "playbooks"] });
    },
  });

  const openEditDialog = (playbook: Playbook) => {
    setEditingPlaybook(playbook);
    setForm({
      skillId: playbook.skillId || "",
      name: playbook.name || "",
      description: playbook.description || "",
      category: playbook.category || "builder",
      difficulty: playbook.difficulty || "intermediate",
      tags: playbook.tags?.join(", ") || "",
      autoActions: playbook.autoActions?.join(", ") || "",
      artifacts: playbook.artifacts?.join(", ") || "",
    });
  };

  const openCreateDialog = () => {
    setShowCreateDialog(true);
    setForm(emptyForm);
  };

  const parseArrayField = (value: string): string[] => {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleCreate = () => {
    createMutation.mutate({
      skillId: form.skillId,
      name: form.name,
      description: form.description || undefined,
      category: form.category,
      difficulty: form.difficulty,
      tags: parseArrayField(form.tags),
      autoActions: parseArrayField(form.autoActions),
      artifacts: parseArrayField(form.artifacts),
    });
  };

  const handleUpdate = () => {
    if (!editingPlaybook) return;
    updateMutation.mutate({
      id: editingPlaybook.id,
      data: {
        skillId: form.skillId,
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        difficulty: form.difficulty,
        tags: parseArrayField(form.tags),
        autoActions: parseArrayField(form.autoActions),
        artifacts: parseArrayField(form.artifacts),
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data?.total || 0} Playbooks
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Playbook
          </Button>
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync from Skills
          </Button>
        </div>
      </div>

      {!data?.categories?.length ? (
        <EmptyState
          icon={BookOpen}
          title="No Playbooks"
          description="Click the button above to create a Playbook or sync from Skills"
        />
      ) : (
        data.categories.map((category) => (
          <div key={category.category}>
            <h3 className="text-base font-medium mb-4 flex items-center gap-2">
              {category.categoryName}
              <Badge variant="secondary">{category.playbooks.length}</Badge>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {category.playbooks.map((playbook) => (
                <div
                  key={playbook.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{playbook.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {playbook.skillId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(playbook)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this Playbook?")) {
                            deleteMutation.mutate(playbook.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {playbook.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {playbook.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{playbook.difficulty}</Badge>
                    {playbook.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingPlaybook}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingPlaybook(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlaybook ? `Edit Playbook: ${editingPlaybook.name}` : "Create Playbook"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Skill ID *</label>
                <Input
                  placeholder="e.g., builder/blog-writer"
                  value={form.skillId}
                  onChange={(e) => setForm({ ...form, skillId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="e.g., Blog Writer"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Playbook description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="builder">Builder</option>
                  <option value="research">Research</option>
                  <option value="optimize">Optimize</option>
                  <option value="monitor">Monitor</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                placeholder="tag1, tag2, tag3 (comma-separated)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Auto Actions</label>
              <Input
                placeholder="action1, action2 (comma-separated)"
                value={form.autoActions}
                onChange={(e) => setForm({ ...form, autoActions: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Artifacts</label>
              <Input
                placeholder="artifact1, artifact2 (comma-separated)"
                value={form.artifacts}
                onChange={(e) => setForm({ ...form, artifacts: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingPlaybook(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingPlaybook ? handleUpdate : handleCreate}
              disabled={
                !form.skillId ||
                !form.name ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingPlaybook
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
