import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Trash2, Search } from "lucide-react";
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
import { adminsApi } from "@/api/config";
// formatDateTime can be used for displaying admin grant timestamps when needed
import { useDebounce } from "@/hooks";

export function AdminsTab() {
  const queryClient = useQueryClient();
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [adminLevel, setAdminLevel] = useState(1);
  const [adminNote, setAdminNote] = useState("");
  const debouncedSearch = useDebounce(searchEmail, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["config", "admins"],
    queryFn: () => adminsApi.list(),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["config", "admins", "search", debouncedSearch],
    queryFn: () => adminsApi.searchUsers(debouncedSearch),
    enabled: debouncedSearch.length > 2,
  });

  const grantMutation = useMutation({
    mutationFn: () =>
      adminsApi.grant({
        userId: selectedUserId,
        level: adminLevel,
        note: adminNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "admins"] });
      setShowGrantDialog(false);
      setSearchEmail("");
      setSelectedUserId("");
      setAdminLevel(1);
      setAdminNote("");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (userId: string) => adminsApi.revoke(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "admins"] });
    },
  });

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
          {data?.total || 0} admins
        </p>
        <Button onClick={() => setShowGrantDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {!data?.admins?.length ? (
        <EmptyState
          icon={Shield}
          title="No Admins"
          description="Click the button above to add an admin"
        />
      ) : (
        <div className="space-y-3">
          {data.admins.map((admin) => (
            <div
              key={admin.userId}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                  {admin.email[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {admin.name || admin.email}
                    </span>
                    <Badge variant={admin.level >= 2 ? "default" : "secondary"}>
                      {admin.levelName}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>{admin.email}</span>
                    {admin.note && (
                      <>
                        <span>·</span>
                        <span>{admin.note}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Are you sure you want to revoke admin access for ${admin.email}?`)) {
                      revokeMutation.mutate(admin.userId);
                    }
                  }}
                disabled={revokeMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Grant Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search User</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchResults?.users && searchResults.users.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {searchResults.users.map((user) => (
                    <button
                      key={user.userId}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${
                        selectedUserId === user.userId ? "bg-accent" : ""
                      }`}
                      onClick={() => {
                        setSelectedUserId(user.userId);
                        setSearchEmail(user.email);
                      }}
                    >
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-muted-foreground text-xs">
                        {user.email}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Permission Level</label>
              <select
                value={adminLevel}
                onChange={(e) => setAdminLevel(Number(e.target.value))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={1}>Admin</option>
                <option value={2}>Super Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <Input
                placeholder="e.g., Operations team"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => grantMutation.mutate()}
              disabled={!selectedUserId || grantMutation.isPending}
            >
              {grantMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
