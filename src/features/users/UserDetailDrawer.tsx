import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Calendar, Coins, Hash, Pencil, Ban, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { iconContainerColors } from "@/lib/styles";
import apiClient from "@/api/client";
import type { UserListItem } from "@/types";

interface UserDetailDrawerProps {
  user: UserListItem | null;
  onClose: () => void;
}

async function updateUser(userId: string, data: { name?: string; email?: string }) {
  const response = await apiClient.put(`/admin/users/${userId}`, data);
  return response.data;
}

async function banUser(userId: string, reason?: string) {
  const response = await apiClient.post(`/admin/users/${userId}/ban`, { reason });
  return response.data;
}

async function unbanUser(userId: string) {
  const response = await apiClient.post(`/admin/users/${userId}/unban`);
  return response.data;
}

export function UserDetailDrawer({ user, onClose }: UserDetailDrawerProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; email?: string }) => 
      updateUser(user?.userId || "", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsEditing(false);
    },
  });

  const banMutation = useMutation({
    mutationFn: () => banUser(user?.userId || "", banReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowBanDialog(false);
      setBanReason("");
    },
  });

  const unbanMutation = useMutation({
    mutationFn: () => unbanUser(user?.userId || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleStartEdit = () => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({ name: editName, email: editEmail });
  };

  const handleBan = () => {
    if (user?.status === "banned") {
      unbanMutation.mutate();
    } else {
      setShowBanDialog(true);
    }
  };

  const handleConfirmBan = () => {
    banMutation.mutate();
  };

  return (
    <Sheet open={!!user} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("users.userDetails")}</SheetTitle>
        </SheetHeader>

        {user && (
          <>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar variant="user" size="xl">
                  {user.email[0].toUpperCase()}
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {user.name || user.email}
                  </h3>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    {user.isAdmin && <Badge>Admin</Badge>}
                    <Badge
                      variant={user.status === "banned" ? "destructive" : "success"}
                    >
                      {user.status === "banned" ? "Banned" : "Active"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-4 bg-muted/20">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Coins className={`h-4 w-4 ${iconContainerColors.amber.text}`} />
                    <span className="text-sm">Token Usage</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatNumber(user.totalTokens)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4 bg-muted/20">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Hash className={`h-4 w-4 ${iconContainerColors.green.text}`} />
                    <span className="text-sm">Total Cost</span>
                  </div>
                  <p className="text-2xl font-bold">${(user.totalCost ?? 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h4 className="font-medium">Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-mono text-sm">{user.userId}</p>
                    </div>
                  </div>
                  {user.lastActiveAt && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Last Active</p>
                        <p className="font-medium">{formatDateTime(user.lastActiveAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <SheetFooter className="flex-col gap-2">
              {isEditing ? (
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-name" className="text-sm font-medium">{t("users.name")}</label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t("users.enterName")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-email" className="text-sm font-medium">{t("users.email")}</label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder={t("users.enterEmail")}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsEditing(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t("common.save")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleStartEdit}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {t("users.editUser")}
                  </Button>
                  <Button
                    variant={user.status === "banned" ? "default" : "destructive"}
                    className="w-full"
                    onClick={handleBan}
                    disabled={banMutation.isPending || unbanMutation.isPending}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {user.status === "banned" ? t("users.unbanUser") : t("users.banUser")}
                  </Button>
                </>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>

      {/* Ban Confirmation Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.confirmBan")}</DialogTitle>
            <DialogDescription>
              {t("users.confirmBanDescription", { email: user?.email || "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="ban-reason" className="text-sm font-medium">{t("users.banReason")}</label>
            <Input
              id="ban-reason"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={t("users.enterBanReason")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmBan}
              disabled={banMutation.isPending}
            >
              {t("users.banUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
