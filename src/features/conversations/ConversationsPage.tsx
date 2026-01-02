import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, MessageSquare, Eye, CheckCircle, XCircle, Clock, Filter, X, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { UserSelect } from "@/components/shared/UserSelect";
import { useI18n } from "@/lib/i18n";
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
import { conversationsApi } from "@/api/conversations";
import { useDebounce } from "@/hooks";
import { usePagination } from "@/hooks/usePagination";
import { formatRelativeTime, cn } from "@/lib/utils";
import { getRowStatusClass } from "@/components/ui/status-indicator";
import { statusColors } from "@/lib/styles";
import { ConversationDetailDrawer } from "./ConversationDetailDrawer";
import type { Conversation } from "@/types";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "idle", label: "Idle" },
  { value: "active", label: "Active" },
  { value: "busy", label: "Busy" },
  { value: "completed", label: "Completed" },
  { value: "error", label: "Error" },
];

const FILE_FILTER_OPTIONS = [
  { value: "all", label: "All Files" },
  { value: "with_files", label: "Has Files" },
  { value: "no_files", label: "No Files" },
];

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle className={`h-4 w-4 ${statusColors.success.text}`} />;
    case "error":
      return <XCircle className={`h-4 w-4 ${statusColors.error.text}`} />;
    case "active":
    case "busy":
      return <Clock className={`h-4 w-4 ${statusColors.warning.text}`} />;
    case "idle":
      return <Clock className={`h-4 w-4 text-muted-foreground`} />;
    default:
      return null;
  }
}

export function ConversationsPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fileFilter, setFileFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { page, pageSize, offset, goToPage, changePageSize } = usePagination();

  // Read userId from URL params
  const userIdFromUrl = searchParams.get("userId");
  const [userIdFilter, setUserIdFilter] = useState<string | null>(userIdFromUrl);

  // Sync userIdFilter with URL params
  useEffect(() => {
    setUserIdFilter(userIdFromUrl);
  }, [userIdFromUrl]);

  const handleUserFilterChange = (userId: string | null) => {
    setUserIdFilter(userId);
    if (userId) {
      searchParams.set("userId", userId);
    } else {
      searchParams.delete("userId");
    }
    setSearchParams(searchParams);
    goToPage(0);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["conversations", { search: debouncedSearch, offset, limit: pageSize, status: statusFilter, fileFilter, userId: userIdFilter }],
    queryFn: () => conversationsApi.list({ 
      offset, 
      limit: pageSize,
      status: statusFilter === "all" ? undefined : statusFilter,
      userId: userIdFilter || undefined,
      hasFiles: fileFilter === "with_files" ? true : fileFilter === "no_files" ? false : undefined,
    }),
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);
  
  // Count active filters
  const activeFilterCount = [
    statusFilter !== "all",
    fileFilter !== "all",
    !!userIdFilter,
  ].filter(Boolean).length;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("conversations.title")}
        description={`${data?.total || 0} ${t("conversations.description")}`}
      />

      <Card>
        <CardContent className="p-0">
          {/* Search bar and filters */}
          <div className="p-4 border-b border-border">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or CID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* User filter dropdown */}
              <UserSelect
                value={userIdFilter}
                onValueChange={handleUserFilterChange}
                placeholder="All Users"
                className="min-w-[180px] max-w-[220px]"
                showClearButton={false}
              />

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                
                {/* Status filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    goToPage(0);
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue>
                      {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || "All Status"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* File filter */}
                <Select
                  value={fileFilter}
                  onValueChange={(value) => {
                    setFileFilter(value);
                    goToPage(0);
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue>
                      {FILE_FILTER_OPTIONS.find(o => o.value === fileFilter)?.label || "All Files"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear all filters */}
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setFileFilter("all");
                      handleUserFilterChange(null);
                      setSearch("");
                      goToPage(0);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear ({activeFilterCount})
                  </Button>
                )}
              </div>
            </div>
            
            {/* Active filter badges */}
            {(userIdFilter || statusFilter !== "all" || fileFilter !== "all") && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                
                {userIdFilter && (
                  <Badge variant="secondary" className="flex items-center gap-1.5">
                    User: {userIdFilter.slice(0, 8)}...
                    <button
                      onClick={() => handleUserFilterChange(null)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {statusFilter !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1.5 capitalize">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {fileFilter !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    {fileFilter === "with_files" ? "Has Files" : "No Files"}
                    <button
                      onClick={() => setFileFilter("all")}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <LoadingPage />
          ) : !data?.items?.length ? (
            <EmptyState
              icon={MessageSquare}
              title={t("conversations.noConversations")}
              description={t("conversations.noConversationsYet")}
              className="px-4"
            />
          ) : (
            <>
              <Table className="md:min-w-[820px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("nav.conversations")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("conversations.messages")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("conversations.files")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("common.status")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("common.updatedAt")}</TableHead>
                    <TableHead className="hidden md:table-cell w-[80px] text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((conv) => (
                    <TableRow key={conv.cid} className={cn(getRowStatusClass(conv.status))}>
                      <TableCell>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {/* Title - show more content */}
                            <div className="flex items-start gap-2">
                              <StatusIcon status={conv.status} />
                              <p className="font-medium leading-snug line-clamp-2 max-w-[300px]">
                                {conv.title || "New Conversation"}
                              </p>
                            </div>
                            
                            {/* CID with status background */}
                            <div className="mt-1.5 ml-6">
                              <span 
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono",
                                  conv.status === "error" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                  conv.status === "completed" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                  conv.status === "active" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                  !["error", "completed", "active"].includes(conv.status) && "bg-muted text-muted-foreground"
                                )}
                              >
                                {conv.cid.slice(0, 16)}...
                              </span>
                            </div>
                            
                            {/* Mobile info */}
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:hidden ml-6">
                              <Badge variant="secondary">
                                {conv.messageCount} messages
                              </Badge>
                              {conv.fileCount > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <FileText className="h-3 w-3" />
                                  {conv.fileCount} files
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  conv.status === "completed"
                                    ? "success"
                                    : conv.status === "error"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="capitalize"
                              >
                                {conv.status}
                              </Badge>
                              <span>Updated {formatRelativeTime(conv.updatedAt)}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setSelectedConversation(conv)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">
                          {conv.messageCount} messages
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {conv.fileCount > 0 ? (
                          <Badge variant="outline" className="gap-1">
                            <FileText className="h-3 w-3" />
                            {conv.fileCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div 
                          className={cn(
                            "inline-flex items-center gap-2 px-2.5 py-1 rounded-md",
                            conv.status === "error" && "bg-red-100 dark:bg-red-900/30",
                            conv.status === "completed" && "bg-green-100 dark:bg-green-900/30",
                            conv.status === "active" && "bg-yellow-100 dark:bg-yellow-900/30",
                            conv.status === "busy" && "bg-orange-100 dark:bg-orange-900/30",
                            conv.status === "idle" && "bg-gray-100 dark:bg-gray-800/50"
                          )}
                        >
                          <StatusIcon status={conv.status} />
                          <span 
                            className={cn(
                              "text-sm font-medium capitalize",
                              conv.status === "error" && "text-red-700 dark:text-red-400",
                              conv.status === "completed" && "text-green-700 dark:text-green-400",
                              conv.status === "active" && "text-yellow-700 dark:text-yellow-400",
                              conv.status === "busy" && "text-orange-700 dark:text-orange-400",
                              conv.status === "idle" && "text-gray-600 dark:text-gray-400"
                            )}
                          >
                            {conv.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatRelativeTime(conv.updatedAt)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedConversation(conv)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={data.total}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  onPageSizeChange={changePageSize}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Conversation Detail Drawer */}
      <ConversationDetailDrawer
        conversation={selectedConversation}
        onClose={() => setSelectedConversation(null)}
      />
    </div>
  );
}
