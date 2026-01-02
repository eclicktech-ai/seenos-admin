import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye, Users, Coins, DollarSign, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/lib/i18n";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { usageApi } from "@/api/usage";
import { useDebounce } from "@/hooks";
import { usePagination } from "@/hooks/usePagination";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { UserDetailDrawer } from "./UserDetailDrawer";
import type { UserListItem } from "@/types";

export function UsersPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { page, pageSize, offset, goToPage, changePageSize } = usePagination();

  // Fetch users list
  const { data, isLoading, error } = useQuery({
    queryKey: ["users", { search: debouncedSearch, offset, limit: pageSize }],
    queryFn: () =>
      usageApi.getUsers({
        search: debouncedSearch || undefined,
        offset,
        limit: pageSize,
      }),
  });

  // Fetch usage summary for statistics
  const { data: summaryData } = useQuery({
    queryKey: ["usage-summary"],
    queryFn: () => usageApi.getSummary(),
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  // Calculate active users (with last activity)
  const activeUsersCount = data?.users?.filter(u => u.lastActiveAt).length || 0;
  const adminCount = data?.users?.filter(u => u.isAdmin).length || 0;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.title")}
        description={t("users.description")}
      />

      {/* Statistics Cards - Using StatCard for consistency */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("users.totalUsers")}
          value={formatNumber(data?.total || 0)}
          icon={Users}
          color="info"
        />
        <StatCard
          title={t("users.activeUsers")}
          value={formatNumber(activeUsersCount)}
          description={`${adminCount} ${t("nav.admins").toLowerCase()}`}
          icon={Activity}
          color="success"
        />
        <StatCard
          title={t("users.totalTokens")}
          value={formatNumber(summaryData?.totalTokens || 0)}
          description={`${formatNumber(summaryData?.callCount || 0)} calls`}
          icon={Coins}
          color="warning"
        />
        <StatCard
          title={t("users.totalCost")}
          value={`$${(summaryData?.totalCost || 0).toFixed(2)}`}
          icon={DollarSign}
          color="default"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Search bar */}
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingPage />
          ) : !data?.users?.length ? (
            <EmptyState
              title={t("users.noUsers")}
              description={search ? t("users.noMatchingUsers") : t("users.noUsersYet")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.user")}</TableHead>
                    <TableHead>{t("users.tokens")}</TableHead>
                    <TableHead>{t("users.cost")}</TableHead>
                    <TableHead>{t("users.lastActive")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="w-[80px]">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar variant="user" size="md">
                            {user.email[0].toUpperCase()}
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">
                              {user.name || user.email}
                            </p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm text-muted-foreground truncate max-w-[200px] cursor-help">
                                  {user.email}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{user.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {formatNumber(user.totalTokens)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          ${user.totalCost.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.lastActiveAt
                            ? formatRelativeTime(user.lastActiveAt)
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.isAdmin
                              ? "default"
                              : user.status === "banned"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {user.isAdmin
                            ? "Admin"
                            : user.status === "banned"
                            ? "Banned"
                            : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Enhanced Pagination */}
              <Pagination
                page={page}
                pageSize={pageSize}
                total={data.total}
                totalPages={totalPages}
                onPageChange={goToPage}
                onPageSizeChange={changePageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
