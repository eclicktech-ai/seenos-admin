import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  MessageSquare,
  Eye,
  Download,
  Filter,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/lib/i18n";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { DateRangeSelector, type CustomDateRange } from "@/components/shared/DateRangeSelector";
import { Pagination } from "@/components/shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { feedbackApi } from "@/api/feedback";
import { usePagination } from "@/hooks/usePagination";
import { formatRelativeTime, cn } from "@/lib/utils";
import { FeedbackDetailDrawer } from "./FeedbackDetailDrawer";
import type { FeedbackListItem, FeedbackType, TrendPeriod } from "@/types/feedback";

// Helper to calculate date range
function getDateRange(days: number) {
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return { startDate, endDate };
}

// Type filter options
const TYPE_OPTIONS = [
  { value: "all", labelKey: "feedback.allTypes" },
  { value: "like", labelKey: "feedback.likesOnly" },
  { value: "dislike", labelKey: "feedback.dislikesOnly" },
];

export function FeedbackPage() {
  const { t } = useI18n();

  // State for date range
  const [days, setDays] = useState(30);
  const [customRange, setCustomRange] = useState<CustomDateRange | null>(null);

  // State for filters
  const [typeFilter, setTypeFilter] = useState<FeedbackType | "all">("all");

  // State for pagination
  const { page, pageSize, offset, goToPage, changePageSize } = usePagination();

  // State for detail drawer
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (customRange) {
      return {
        startDate: new Date(customRange.startDate).toISOString(),
        endDate: new Date(customRange.endDate + "T23:59:59").toISOString(),
      };
    }
    return getDateRange(days);
  }, [days, customRange]);

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["feedback", "stats", dateRange],
    queryFn: () =>
      feedbackApi.getStats({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        period: "day" as TrendPeriod,
      }),
  });

  // Fetch list
  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["feedback", "list", { typeFilter, offset, limit: pageSize, dateRange }],
    queryFn: () =>
      feedbackApi.list({
        type: typeFilter === "all" ? undefined : typeFilter,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: pageSize,
        offset,
      }),
  });

  const totalPages = Math.ceil((listData?.total || 0) / pageSize);

  // Handle date range change
  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    setCustomRange(null);
    goToPage(0);
  };

  const handleCustomRangeChange = (range: CustomDateRange) => {
    setCustomRange(range);
    goToPage(0);
  };

  // Handle export
  const handleExport = async () => {
    try {
      // Fetch all dislikes for export
      const response = await feedbackApi.list({
        type: "dislike",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 1000,
        offset: 0,
      });

      // Fetch details for each feedback
      const detailPromises = response.feedbacks.map((f) =>
        feedbackApi.getDetail(f.id)
      );
      const details = await Promise.all(detailPromises);

      // Convert to JSONL format
      const jsonl = details
        .map((detail) =>
          JSON.stringify({
            prompt: detail.userInput,
            response: detail.assistantOutput,
            feedback: detail.reason,
            feedback_type: detail.feedbackType,
            model: detail.modelName,
            conversation_history: detail.conversationHistory,
            created_at: detail.createdAt,
          })
        )
        .join("\n");

      // Download
      const blob = new Blob([jsonl], { type: "application/jsonl" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback_export_${new Date().toISOString().split("T")[0]}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Count active filters
  const activeFilterCount = typeFilter !== "all" ? 1 : 0;

  if (statsLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("feedback.title")}
        description={t("feedback.description")}
      />

      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <DateRangeSelector
          value={days}
          onChange={handleDaysChange}
          onCustomRangeChange={handleCustomRangeChange}
          customRange={customRange}
          showIcon
        />
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          {t("feedback.exportJsonl")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("feedback.totalCount")}
          value={stats?.totalCount || 0}
          icon={MessageSquare}
          color="info"
        />
        <StatCard
          title={t("feedback.likeCount")}
          value={stats?.likeCount || 0}
          icon={ThumbsUp}
          color="success"
        />
        <StatCard
          title={t("feedback.dislikeCount")}
          value={stats?.dislikeCount || 0}
          icon={ThumbsDown}
          color="error"
        />
        <StatCard
          title={t("feedback.likeRatio")}
          value={`${((stats?.likeRatio || 0) * 100).toFixed(1)}%`}
          icon={TrendingUp}
          color="default"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t("feedback.trend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.trend && stats.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--chart-axis))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis
                    stroke="hsl(var(--chart-axis))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--chart-tooltip-bg))",
                      border: "1px solid hsl(var(--chart-tooltip-border))",
                      borderRadius: "6px",
                      color: "hsl(var(--chart-tooltip-text))",
                    }}
                    labelFormatter={(value) => `${t("common.date")}: ${value}`}
                    formatter={(value, name) => [
                      value ?? 0,
                      name === "likes" ? t("feedback.likeCount") : t("feedback.dislikeCount"),
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "likes" ? t("feedback.likeCount") : t("feedback.dislikeCount")
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="likes"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: "#22c55e", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dislikes"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: "#ef4444", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title={t("feedback.noFeedback")}
                description={t("feedback.noFeedbackYet")}
              />
            )}
          </CardContent>
        </Card>

        {/* Model Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-primary" />
              {t("feedback.byModel")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.byModel && stats.byModel.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart
                  data={stats.byModel.map((m) => ({
                    ...m,
                    // Truncate long model names
                    displayName:
                      m.model.length > 20 ? m.model.slice(0, 17) + "..." : m.model,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis type="number" stroke="hsl(var(--chart-axis))" fontSize={12} />
                  <YAxis
                    dataKey="displayName"
                    type="category"
                    width={120}
                    stroke="hsl(var(--chart-axis))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--chart-tooltip-bg))",
                      border: "1px solid hsl(var(--chart-tooltip-border))",
                      borderRadius: "6px",
                      color: "hsl(var(--chart-tooltip-text))",
                    }}
                    formatter={(value, name) => [
                      value ?? 0,
                      name === "likes" ? t("feedback.likeCount") : t("feedback.dislikeCount"),
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "likes" ? t("feedback.likeCount") : t("feedback.dislikeCount")
                    }
                  />
                  <Bar dataKey="likes" fill="#22c55e" stackId="stack" />
                  <Bar dataKey="dislikes" fill="#ef4444" stackId="stack" />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title={t("feedback.noFeedback")}
                description={t("feedback.noFeedbackYet")}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="p-4 border-b border-border">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />

              {/* Type filter */}
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value as FeedbackType | "all");
                  goToPage(0);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue>
                    {t(TYPE_OPTIONS.find((o) => o.value === typeFilter)?.labelKey || "feedback.allTypes")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTypeFilter("all");
                    goToPage(0);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t("common.clear")} ({activeFilterCount})
                </Button>
              )}

              <span className="text-sm text-muted-foreground ml-auto">
                {t("common.total")}: {listData?.total || 0}
              </span>
            </div>
          </div>

          {/* Table */}
          {listLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !listData?.feedbacks?.length ? (
            <EmptyState
              icon={MessageSquare}
              title={t("feedback.noFeedback")}
              description={t("feedback.noFeedbackYet")}
              className="py-12"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{t("common.type")}</TableHead>
                    <TableHead>{t("feedback.reason")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("config.model")}
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("common.user")}
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("common.time")}
                    </TableHead>
                    <TableHead className="w-[60px] text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listData.feedbacks.map((feedback: FeedbackListItem) => (
                    <TableRow
                      key={feedback.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        feedback.feedbackType === "dislike" &&
                          "bg-red-50/50 dark:bg-red-950/20"
                      )}
                      onClick={() => setSelectedFeedbackId(feedback.id)}
                    >
                      <TableCell>
                        {feedback.feedbackType === "like" ? (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-200 dark:text-green-400 dark:border-green-800"
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            {t("feedback.likeCount")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-red-600 border-red-200 dark:text-red-400 dark:border-red-800"
                          >
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            {t("feedback.dislikeCount")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[300px] truncate">{feedback.reason}</p>
                        {/* Mobile info */}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:hidden">
                          {feedback.modelName && feedback.modelName.length > 0 && (
                            <code className="bg-muted px-1 py-0.5 rounded">
                              {feedback.modelName.length > 15
                                ? `${feedback.modelName.slice(0, 15)}...`
                                : feedback.modelName}
                            </code>
                          )}
                          <span>{formatRelativeTime(feedback.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {feedback.modelName ? (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {feedback.modelName.length > 20
                              ? feedback.modelName.slice(0, 17) + "..."
                              : feedback.modelName}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-mono text-xs">
                          {feedback.userId ? `${feedback.userId.slice(0, 8)}...` : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatRelativeTime(feedback.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFeedbackId(feedback.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={listData.total}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  onPageSizeChange={changePageSize}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <FeedbackDetailDrawer
        feedbackId={selectedFeedbackId}
        onClose={() => setSelectedFeedbackId(null)}
      />
    </div>
  );
}
