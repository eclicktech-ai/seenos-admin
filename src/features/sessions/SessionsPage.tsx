import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Users,
  Activity,
  Eye,
  MessageSquare,
  Trophy,
  Monitor,
  Smartphone,
  Globe,
  XCircle,
  Timer,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/lib/i18n";
import { StatCard } from "@/components/shared/StatCard";
import { DateRangeSelector } from "@/components/shared/DateRangeSelector";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { sessionsApi } from "@/api/sessions";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";
import { Avatar } from "@/components/ui/avatar";
import { statusColors } from "@/lib/styles";
import type { SessionItem, UserDurationRankItem } from "@/types/session";

const AreaChart = lazy(() =>
  import("@/components/charts/AreaChart").then((mod) => ({ default: mod.AreaChart }))
);

// Helper to format duration
function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Device icon component
function DeviceIcon({ type }: { type?: string }) {
  switch (type?.toLowerCase()) {
    case "mobile":
      return <Smartphone className="h-4 w-4" />;
    case "web":
      return <Monitor className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
}

// Duration Ranking Table Component
function DurationRankingTable({
  users,
  loading,
}: {
  users: UserDurationRankItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user, index) => (
        <div
          key={user.userId}
          className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
        >
          {/* Rank badge */}
          <Avatar rank={index + 1} size="sm">
            {index + 1}
          </Avatar>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.name || user.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>

          {/* Stats */}
          <div className="text-right">
            <p className="font-mono font-semibold text-primary">
              {user.totalDurationFormatted}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.sessionCount} sessions
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SessionsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [days, setDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "ended">("all");
  const [sessionToEnd, setSessionToEnd] = useState<SessionItem | null>(null);
  const { page, pageSize, offset, goToPage, changePageSize } = usePagination();

  // Fetch session stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-sessions", "stats", days],
    queryFn: () => sessionsApi.getStats({ days }),
  });

  // Fetch session list
  const { data: sessionList, isLoading: listLoading } = useQuery({
    queryKey: ["admin-sessions", "list", { days, statusFilter, offset, pageSize }],
    queryFn: () =>
      sessionsApi.list({
        days,
        status: statusFilter === "all" ? undefined : statusFilter,
        offset,
        limit: pageSize,
      }),
  });

  // Fetch duration ranking
  const { data: ranking, isLoading: rankingLoading } = useQuery({
    queryKey: ["admin-sessions", "ranking", days],
    queryFn: () => sessionsApi.getRanking({ days, limit: 10 }),
  });

  // Fetch trends
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["admin-sessions", "trends", days],
    queryFn: () => sessionsApi.getTrends({ days }),
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsApi.endSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
      setSessionToEnd(null);
    },
  });

  const totalPages = Math.ceil((sessionList?.total || 0) / pageSize);

  const formatChartDate = useCallback(
    (dateStr: string) =>
      new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    []
  );

  const trendChartData = useMemo(
    () =>
      trends?.dailyStats?.map((d) => ({
        date: formatChartDate(d.date),
        sessions: d.sessionCount,
        users: d.uniqueUsers,
        hours: Math.round(d.totalDurationHours * 10) / 10,
      })) || [],
    [trends, formatChartDate]
  );

  if (statsLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sessions.title")}
        description={t("sessions.description")}
      />

      {/* Time Range Selector */}
      <div className="flex justify-end">
        <DateRangeSelector
          value={days}
          onChange={setDays}
          customRange={null}
          onCustomRangeChange={() => {}}
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("sessions.totalSessions")}
          value={formatNumber(stats?.totalSessions || 0)}
          description={`${stats?.activeSessions || 0} currently active`}
          icon={Activity}
          color="info"
        />
        <StatCard
          title={t("sessions.totalOnlineTime")}
          value={`${Math.round(stats?.totalDurationHours || 0)}h`}
          description={`Avg ${Math.round(stats?.avgDurationMinutes || 0)}m per session`}
          icon={Clock}
          color="success"
        />
        <StatCard
          title={t("sessions.uniqueUsers")}
          value={formatNumber(stats?.uniqueUsers || 0)}
          icon={Users}
          color="warning"
        />
        <StatCard
          title={t("sessions.totalMessages")}
          value={formatNumber(stats?.totalMessages || 0)}
          description={`${formatNumber(stats?.totalPageViews || 0)} page views`}
          icon={MessageSquare}
          color="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Session Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-5 w-5 text-sky-500" />
              {t("sessions.sessionTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : trendChartData.length > 0 ? (
              <Suspense
                fallback={
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                }
              >
                <AreaChart
                  data={trendChartData}
                  xKey="date"
                  yKey="sessions"
                  height={300}
                  color="hsl(var(--chart-series-1))"
                  gradientId="sessionTrendGradient"
                />
              </Suspense>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No session data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Duration Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-amber-500" />
              {t("sessions.topUsersByOnlineTime")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DurationRankingTable
              users={ranking?.users || []}
              loading={rankingLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Session List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent Sessions</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | "active" | "ended")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue>
                  {statusFilter === "all" ? "All Status" : statusFilter === "active" ? "Active" : "Ended"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {listLoading ? (
            <LoadingPage />
          ) : !sessionList?.sessions?.length ? (
            <EmptyState
              title={t("sessions.noSessions")}
              description={t("sessions.noSessionsFound")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.user")}</TableHead>
                    <TableHead>{t("sessions.device")}</TableHead>
                    <TableHead>{t("common.duration")}</TableHead>
                    <TableHead>{t("sessions.activity")}</TableHead>
                    <TableHead>{t("table.startTime")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="w-[80px]">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionList.sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar variant="session" size="sm">
                            {session.userEmail[0].toUpperCase()}
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {session.userName || session.userEmail}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.userEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon type={session.deviceType} />
                          <span className="text-sm capitalize">
                            {session.deviceType || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {formatDuration(session.durationSeconds)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {session.pageViews}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {session.messageCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatRelativeTime(session.startedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={session.endedAt ? "secondary" : "default"}
                          className={!session.endedAt ? `${statusColors.success.bg} ${statusColors.success.text} ${statusColors.success.bgHover}` : ""}
                        >
                          {session.endedAt ? "Ended" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!session.endedAt && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSessionToEnd(session)}
                            title="End session"
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Enhanced Pagination */}
              <Pagination
                page={page}
                pageSize={pageSize}
                total={sessionList.total}
                totalPages={totalPages}
                onPageChange={goToPage}
                onPageSizeChange={changePageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* End Session Confirmation Dialog */}
      <ConfirmDialog
        open={!!sessionToEnd}
        onOpenChange={(open) => !open && setSessionToEnd(null)}
        title="End Session"
        description={`Are you sure you want to end the session for ${sessionToEnd?.userEmail}? This will log them out immediately.`}
        confirmText="End Session"
        variant="destructive"
        loading={endSessionMutation.isPending}
        onConfirm={() => {
          if (sessionToEnd) {
            endSessionMutation.mutate(sessionToEnd.id);
          }
        }}
      />
    </div>
  );
}
