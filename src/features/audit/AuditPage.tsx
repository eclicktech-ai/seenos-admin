import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/lib/i18n";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { DateRangeSelector, type CustomDateRange } from "@/components/shared/DateRangeSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import apiClient from "@/api/client";

interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

interface BackendAuditLog {
  id: string;
  project_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface BackendAuditLogsResponse {
  logs: BackendAuditLog[];
  total: number;
  limit: number;
  offset: number;
}

async function getAuditLogs(params: {
  offset?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AuditLogsResponse> {
  try {
    const response = await apiClient.get<BackendAuditLogsResponse>("/admin/audit/logs", {
      params: {
        offset: params.offset,
        limit: params.limit,
        action: params.action || undefined,
        entityType: params.entityType || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
      },
    });
    // Map snake_case to camelCase
    const logs: AuditLog[] = response.data.logs.map((log) => ({
      id: log.id,
      userId: log.user_id || "",
      action: log.action,
      resourceType: log.entity_type,
      resourceId: log.entity_id || undefined,
      details: log.new_value || undefined,
      createdAt: log.created_at,
    }));
    return { logs, total: response.data.total };
  } catch {
    // API not implemented yet
    return { logs: [], total: 0 };
  }
}

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
];

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "singleton", label: "Singleton" },
  { value: "item", label: "Item" },
  { value: "person", label: "Person" },
  { value: "entity", label: "Entity" },
  { value: "knowledge_source", label: "Knowledge Source" },
];

const actionColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  create: "success",
  update: "warning",
  delete: "destructive",
  login: "default",
  logout: "secondary",
};

export function AuditPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [dateRangeDays, setDateRangeDays] = useState(30);
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange | null>(null);
  const pageSize = 20;

  // Calculate date range
  const getDateParams = () => {
    if (dateRangeDays === -1 && customDateRange) {
      return {
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate,
      };
    }
    if (dateRangeDays > 0) {
      const now = new Date();
      const start = new Date(now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
      return {
        startDate: start.toISOString(),
        endDate: now.toISOString(),
      };
    }
    return {};
  };

  const dateParams = getDateParams();

  const { data, isLoading } = useQuery({
    queryKey: ["audit", "logs", { 
      offset: page * pageSize, 
      limit: pageSize,
      action: actionFilter,
      entityType: entityTypeFilter,
      ...dateParams,
    }],
    queryFn: () => getAuditLogs({ 
      offset: page * pageSize, 
      limit: pageSize,
      action: actionFilter || undefined,
      entityType: entityTypeFilter || undefined,
      ...dateParams,
    }),
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  // Filter logs by search term (client-side)
  const filteredLogs = data?.logs?.filter((log) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.resourceType.toLowerCase().includes(searchLower) ||
      log.resourceId?.toLowerCase().includes(searchLower) ||
      log.userId?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const hasActiveFilters = actionFilter || entityTypeFilter;

  const clearFilters = () => {
    setActionFilter("");
    setEntityTypeFilter("");
    setPage(0);
  };

  return (
    <div>
      <PageHeader
        title={t("audit.title")}
        description={t("audit.description")}
      />

      <Card>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select 
              value={actionFilter || "__all__"} 
              onValueChange={(v) => { setActionFilter(v === "__all__" ? "" : v); setPage(0); }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue>
                  {ACTION_OPTIONS.find(o => o.value === actionFilter)?.label || t("audit.allActions")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value || "all"} value={option.value || "__all__"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={entityTypeFilter || "__all__"} 
              onValueChange={(v) => { setEntityTypeFilter(v === "__all__" ? "" : v); setPage(0); }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue>
                  {ENTITY_TYPE_OPTIONS.find(o => o.value === entityTypeFilter)?.label || t("audit.allTypes")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value || "all"} value={option.value || "__all__"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangeSelector
              value={dateRangeDays}
              onChange={(days) => { setDateRangeDays(days); setPage(0); }}
              customRange={customDateRange}
              onCustomRangeChange={(range) => { setCustomDateRange(range); setDateRangeDays(-1); setPage(0); }}
            />

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                {t("common.clearFilters")}
              </Button>
            )}
          </div>

          {isLoading ? (
            <LoadingPage />
          ) : !filteredLogs?.length ? (
            <EmptyState
              icon={FileText}
              title={t("audit.noLogs")}
              description={t("audit.noLogsDescription")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.time")}</TableHead>
                    <TableHead>{t("common.user")}</TableHead>
                    <TableHead>{t("audit.action")}</TableHead>
                    <TableHead>{t("audit.resourceType")}</TableHead>
                    <TableHead>{t("audit.resourceId")}</TableHead>
                    <TableHead>{t("audit.ipAddress")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {log.userEmail || log.userId?.slice(0, 8) || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={actionColors[log.action.toLowerCase()] || "secondary"}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.resourceType}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {log.resourceId?.slice(0, 12) || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ipAddress || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && data && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1}-
                    {Math.min((page + 1) * pageSize, data.total)} of{" "}
                    {data.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

