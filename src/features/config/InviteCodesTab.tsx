import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Key, Plus, Trash2, Copy, Check, Pencil, Users } from "lucide-react";
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
import { inviteCodesApi, type InviteCodeUsage } from "@/api/config";
import { formatDateTime } from "@/lib/utils";
import type { InviteCode } from "@/types";

export function InviteCodesTab() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(10);
  const [newCodeNote, setNewCodeNote] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Edit dialog state
  const [editingCode, setEditingCode] = useState<InviteCode | null>(null);
  const [editMaxUses, setEditMaxUses] = useState(10);
  const [editNote, setEditNote] = useState("");
  
  // Usages dialog state
  const [viewingUsagesFor, setViewingUsagesFor] = useState<InviteCode | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["config", "invite-codes"],
    queryFn: () => inviteCodesApi.list(false),
  });

  const { data: usagesData, isLoading: usagesLoading } = useQuery({
    queryKey: ["config", "invite-code-usages", viewingUsagesFor?.id],
    queryFn: () => inviteCodesApi.getUsages(viewingUsagesFor!.id),
    enabled: !!viewingUsagesFor,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      inviteCodesApi.create({
        maxUses: newCodeMaxUses,
        note: newCodeNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "invite-codes"] });
      setShowCreateDialog(false);
      setNewCodeMaxUses(10);
      setNewCodeNote("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { maxUses?: number; note?: string } }) =>
      inviteCodesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "invite-codes"] });
      setEditingCode(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inviteCodesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "invite-codes"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? inviteCodesApi.activate(id) : inviteCodesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "invite-codes"] });
    },
  });

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditDialog = (code: InviteCode) => {
    setEditingCode(code);
    setEditMaxUses(code.maxUses);
    setEditNote(code.note || "");
  };

  const handleSaveEdit = () => {
    if (!editingCode) return;
    updateMutation.mutate({
      id: editingCode.id,
      data: {
        maxUses: editMaxUses,
        note: editNote,
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
          {data?.total || 0} invite codes
        </p>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invite Code
        </Button>
      </div>

      {!data?.codes?.length ? (
        <EmptyState
          icon={Key}
          title="No Invite Codes"
          description="Click the button above to create invite codes"
        />
      ) : (
        <div className="space-y-3">
          {data.codes.map((code) => (
            <div
              key={code.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono font-medium">{code.code}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyCode(code.code, code.id)}
                    >
                      {copiedId === code.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <button
                      className="hover:text-foreground hover:underline cursor-pointer"
                      onClick={() => setViewingUsagesFor(code)}
                    >
                      Used {code.usedCount} / {code.maxUses}
                    </button>
                    {code.note && (
                      <>
                        <span>·</span>
                        <span>{code.note}</span>
                      </>
                    )}
                    {code.expiresAt && (
                      <>
                        <span>·</span>
                        <span>Expires {formatDateTime(code.expiresAt)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={code.isActive ? "success" : "secondary"}>
                  {code.isActive ? "Active" : "Disabled"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(code)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewingUsagesFor(code)}
                  title="View Usages"
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggleMutation.mutate({
                      id: code.id,
                      isActive: !code.isActive,
                    })
                  }
                  disabled={toggleMutation.isPending}
                >
                  {code.isActive ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this invite code?")) {
                      deleteMutation.mutate(code.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invite Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Uses</label>
              <Input
                type="number"
                min={1}
                value={newCodeMaxUses}
                onChange={(e) => setNewCodeMaxUses(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <Input
                placeholder="e.g., Beta testers"
                value={newCodeNote}
                onChange={(e) => setNewCodeNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCode} onOpenChange={(open) => !open && setEditingCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invite Code: {editingCode?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Uses</label>
              <Input
                type="number"
                min={1}
                value={editMaxUses}
                onChange={(e) => setEditMaxUses(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Currently used: {editingCode?.usedCount || 0}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <Input
                placeholder="e.g., Beta testers"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCode(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usages Dialog */}
      <Dialog open={!!viewingUsagesFor} onOpenChange={(open) => !open && setViewingUsagesFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Code Usages: <code className="font-mono">{viewingUsagesFor?.code}</code>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {usagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : !usagesData?.usages?.length ? (
              <EmptyState
                icon={Users}
                title="No Usages"
                description="This invite code hasn't been used yet"
              />
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {usagesData.usages.map((usage: InviteCodeUsage) => (
                  <div
                    key={usage.userId}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium">{usage.name || usage.email}</p>
                      <p className="text-sm text-muted-foreground">{usage.email}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(usage.usedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingUsagesFor(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
