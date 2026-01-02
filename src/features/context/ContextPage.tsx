import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, HardDrive, FileText, Users, Building2, Lightbulb, ChevronDown, ChevronRight, Eye, User } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/lib/i18n";
import { LoadingPage, LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { contextApi, type ProjectContextStats } from "@/api/context";
import { formatBytes, formatNumber, formatDateTime } from "@/lib/utils";

export function ContextPage() {
  const { t } = useI18n();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [viewingDetails, setViewingDetails] = useState<string | null>(null);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["context", "stats"],
    queryFn: () => contextApi.getAllStats(),
  });

  const { data: projectDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["context", "details", viewingDetails],
    queryFn: () => contextApi.getProjectDetails(viewingDetails!),
    enabled: !!viewingDetails,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load: {(error as Error).message}</p>
      </div>
    );
  }

  // Calculate totals
  const totals = stats?.reduce(
    (acc, project) => ({
      singletons: acc.singletons + (project.stats?.singletons || 0),
      items: acc.items + (project.stats?.items || 0),
      persons: acc.persons + (project.stats?.persons || 0),
      entities: acc.entities + (project.stats?.entities || 0),
      knowledgeSources: acc.knowledgeSources + (project.stats?.knowledgeSources || 0),
      totalSize: acc.totalSize + (project.stats?.totalSize || 0),
    }),
    { singletons: 0, items: 0, persons: 0, entities: 0, knowledgeSources: 0, totalSize: 0 }
  ) || { singletons: 0, items: 0, persons: 0, entities: 0, knowledgeSources: 0, totalSize: 0 };

  const toggleExpand = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  return (
    <div>
      <PageHeader
        title={t("context.title")}
        description={t("context.description")}
      />

      {/* Global Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title={t("context.singletons")}
          value={formatNumber(totals.singletons)}
          icon={FileText}
          color="info"
        />
        <StatCard
          title={t("context.items")}
          value={formatNumber(totals.items)}
          icon={Database}
          color="success"
        />
        <StatCard
          title={t("context.persons")}
          value={formatNumber(totals.persons)}
          icon={Users}
          color="warning"
        />
        <StatCard
          title={t("context.entities")}
          value={formatNumber(totals.entities)}
          icon={Building2}
          color="default"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <StatCard
          title={t("context.knowledgeSources")}
          value={formatNumber(totals.knowledgeSources)}
          icon={Lightbulb}
          color="info"
        />
        <StatCard
          title={t("context.totalStorage")}
          value={formatBytes(totals.totalSize)}
          icon={HardDrive}
          color="success"
        />
      </div>

      {/* Project Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("context.projectContextDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.length ? (
            <EmptyState
              icon={Database}
              title={t("context.noData")}
              description={t("context.noDataDescription")}
            />
          ) : (
            <div className="space-y-4">
              {stats.map((project) => (
                <ProjectContextCard
                  key={project.projectId}
                  project={project}
                  isExpanded={expandedProject === project.projectId}
                  onToggle={() => toggleExpand(project.projectId)}
                  onViewDetails={() => setViewingDetails(project.projectId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!viewingDetails} onOpenChange={(open) => !open && setViewingDetails(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Context Details: {projectDetails?.projectName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : projectDetails ? (
              <div className="space-y-6">
                {/* Owner Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">{projectDetails.ownerEmail || projectDetails.ownerId}</p>
                  </div>
                </div>

                {/* Singletons */}
                <ContextSection
                  title="Singletons"
                  icon={FileText}
                  items={projectDetails.singletons}
                  color="text-sky-500"
                />

                {/* Items */}
                <ContextSection
                  title="Items"
                  icon={Database}
                  items={projectDetails.items}
                  color="text-emerald-500"
                />

                {/* Persons */}
                <ContextSection
                  title="Persons"
                  icon={Users}
                  items={projectDetails.persons}
                  color="text-amber-500"
                />

                {/* Entities */}
                <ContextSection
                  title="Entities"
                  icon={Building2}
                  items={projectDetails.entities}
                  color="text-cyan-500"
                />

                {/* Knowledge Sources */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-cyan-500" />
                    Knowledge Sources ({projectDetails.knowledgeSources.length})
                  </h4>
                  {projectDetails.knowledgeSources.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No knowledge sources</p>
                  ) : (
                    <div className="space-y-2">
                      {projectDetails.knowledgeSources.map((ks) => (
                        <div key={ks.id} className="p-3 rounded-lg border border-border text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{ks.title}</span>
                            <Badge variant="secondary">{ks.sourceType}</Badge>
                          </div>
                          {ks.url && (
                            <p className="text-muted-foreground truncate mt-1">{ks.url}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Added: {formatDateTime(ks.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingDetails(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProjectContextCardProps {
  project: ProjectContextStats;
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
}

function ProjectContextCard({ project, isExpanded, onToggle, onViewDetails }: ProjectContextCardProps) {
  const hasContent = (project.stats?.singletons || 0) + 
    (project.stats?.items || 0) + 
    (project.stats?.persons || 0) + 
    (project.stats?.entities || 0) + 
    (project.stats?.knowledgeSources || 0) > 0;

  return (
    <div className="rounded-lg border border-border">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <h4 className="font-medium">{project.projectName}</h4>
            <p className="text-sm text-muted-foreground font-mono">
              {project.projectId.slice(0, 12)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {formatBytes(project.stats?.totalSize || 0)}
          </span>
          {hasContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-5 gap-4 text-sm border-t border-border pt-4">
            <div>
              <p className="text-muted-foreground">Singletons</p>
              <p className="font-medium">{project.stats?.singletons || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Items</p>
              <p className="font-medium">{project.stats?.items || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Persons</p>
              <p className="font-medium">{project.stats?.persons || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Entities</p>
              <p className="font-medium">{project.stats?.entities || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Knowledge</p>
              <p className="font-medium">{project.stats?.knowledgeSources || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ContextSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{
    id: string;
    section: string;
    category?: string;
    data: Record<string, unknown>;
    createdAt: string;
  }>;
  color: string;
}

function ContextSection({ title, icon: Icon, items, color }: ContextSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        className="w-full flex items-center justify-between font-medium mb-2 hover:bg-muted/50 p-2 rounded-lg -mx-2"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          {title} ({items.length})
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {expanded && (
        <div className="space-y-2 ml-6">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No data</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="p-3 rounded-lg border border-border text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{item.section}</span>
                  {item.category && (
                    <Badge variant="outline">{item.category}</Badge>
                  )}
                </div>
                <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto max-h-32">
                  {JSON.stringify(item.data, null, 2)}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
