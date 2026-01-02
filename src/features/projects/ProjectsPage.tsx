import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Globe, Trash2, Eye, Database, FolderKanban, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/lib/i18n";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { projectsApi } from "@/api/projects";
import { contextApi } from "@/api/context";
import { useDebounce } from "@/hooks";
import { usePagination } from "@/hooks/usePagination";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { ProjectDetailDrawer } from "./ProjectDetailDrawer";
import type { Project } from "@/types";

// Status badge variants
const getStatusVariant = (status?: string) => {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "warning";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
};

const formatStatus = (status?: string) => {
  if (!status) return "-";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export function ProjectsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [clearContextProject, setClearContextProject] = useState<Project | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { page, pageSize, offset, goToPage } = usePagination();

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", { search: debouncedSearch, offset, limit: pageSize }],
    queryFn: () => projectsApi.adminList({ offset, limit: pageSize }),
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteProject(null);
    },
  });

  const clearContextMutation = useMutation({
    mutationFn: (projectId: string) => contextApi.clearContext(projectId, false),
    onSuccess: (data) => {
      const total = Object.values(data.deleted || {}).reduce((a, b) => a + b, 0);
      toast.success(`Cleared ${total} context items`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["context"] });
      setClearContextProject(null);
    },
    onError: (err) => {
      toast.error(`Failed to clear context: ${(err as Error).message}`);
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  // Filter projects by search (client-side for now)
  const filteredProjects = data?.projects?.filter(
    (p) =>
      !debouncedSearch ||
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.domain?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const projects = data?.projects || [];
    const completed = projects.filter(p => p.onboardingStatus === "completed").length;
    const inProgress = projects.filter(p => p.onboardingStatus === "in_progress").length;
    const withDomain = projects.filter(p => p.domain).length;
    return { completed, inProgress, withDomain };
  }, [data?.projects]);

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
        title={t("projects.title")}
        description={t("projects.description")}
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-sky-500/10 flex items-center justify-center">
                <FolderKanban className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("projects.totalProjects")}</p>
                <p className="text-2xl font-bold">{formatNumber(data?.total || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("projects.completed")}</p>
                <p className="text-2xl font-bold">{formatNumber(stats.completed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("projects.inProgress")}</p>
                <p className="text-2xl font-bold">{formatNumber(stats.inProgress)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("projects.withDomain")}</p>
                <p className="text-2xl font-bold">{formatNumber(stats.withDomain)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Search bar */}
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or domain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingPage />
          ) : !filteredProjects?.length ? (
            <EmptyState
              title={t("projects.noProjects")}
              description={search ? t("projects.noMatchingProjects") : t("projects.noProjectsYet")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.projectName")}</TableHead>
                    <TableHead>{t("common.domain")}</TableHead>
                    <TableHead>{t("projects.owner")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("projects.research")}</TableHead>
                    <TableHead>{t("common.updatedAt")}</TableHead>
                    <TableHead className="w-[120px]">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                            {project.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground font-mono">
                              {project.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.domain ? (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={project.websiteUrl || `https://${project.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {project.domain}
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {project.ownerEmail || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {project.onboardingStatus ? (
                          <Badge variant={getStatusVariant(project.onboardingStatus)}>
                            {formatStatus(project.onboardingStatus)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.researchStatus || project.currentStep ? (
                          <div className="space-y-1.5">
                            {project.researchStatus && (
                              <Badge variant={getStatusVariant(project.researchStatus)} className="text-xs">
                                {formatStatus(project.researchStatus)}
                              </Badge>
                            )}
                            {project.currentStep && (
                              <p className="text-xs text-muted-foreground leading-tight">
                                {formatStatus(project.currentStep)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(project.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedProject(project)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setClearContextProject(project)}
                            title="Clear Context"
                          >
                            <Database className="h-4 w-4 text-amber-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteProject(project)}
                            title="Delete Project"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {offset + 1}-{Math.min(offset + pageSize, data?.total || 0)} of{" "}
                    {data?.total || 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(page - 1)}
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
                      onClick={() => goToPage(page + 1)}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteProject?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteProject) {
            deleteMutation.mutate(deleteProject.id);
          }
        }}
        loading={deleteMutation.isPending}
      />

      {/* Clear Context Confirmation */}
      <ConfirmDialog
        open={!!clearContextProject}
        onOpenChange={(open) => !open && setClearContextProject(null)}
        title="Clear Project Context"
        description={`Are you sure you want to clear all context data for "${clearContextProject?.name}"? This includes singletons, items, persons, entities, and knowledge sources. This action cannot be undone.`}
        confirmText="Clear Context"
        variant="destructive"
        onConfirm={() => {
          if (clearContextProject) {
            clearContextMutation.mutate(clearContextProject.id);
          }
        }}
        loading={clearContextMutation.isPending}
      />

      <ProjectDetailDrawer
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
