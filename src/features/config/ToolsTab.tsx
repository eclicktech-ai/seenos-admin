import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, Check, X, Pencil } from "lucide-react";
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
import { toolsApi } from "@/api/config";
import type { ToolConfig } from "@/types";

export function ToolsTab() {
  const queryClient = useQueryClient();
  const [editingTool, setEditingTool] = useState<ToolConfig | null>(null);
  const [settingsJson, setSettingsJson] = useState("");
  const [jsonError, setJsonError] = useState("");

  const { data: tools, isLoading } = useQuery({
    queryKey: ["config", "tools"],
    queryFn: () => toolsApi.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ name, isEnabled }: { name: string; isEnabled: boolean }) =>
      toolsApi.toggle(name, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "tools"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ name, settings }: { name: string; settings: Record<string, unknown> }) =>
      toolsApi.update(name, { settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "tools"] });
      setEditingTool(null);
    },
  });

  const openEditDialog = (tool: ToolConfig) => {
    setEditingTool(tool);
    setSettingsJson(JSON.stringify(tool.settings || {}, null, 2));
    setJsonError("");
  };

  const handleSave = () => {
    if (!editingTool) return;

    try {
      const settings = JSON.parse(settingsJson || "{}");
      updateMutation.mutate({
        name: editingTool.name,
        settings,
      });
    } catch (e) {
      setJsonError("Invalid JSON format");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!tools?.length) {
    return (
      <EmptyState
        icon={Wrench}
        title="No Tool Config"
        description="Tool configuration will be displayed here"
      />
    );
  }

  // Group tools by category
  const groupedTools = tools.reduce((acc, tool) => {
    const category = tool.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, typeof tools>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedTools).map(([category, categoryTools]) => (
        <div key={category}>
          <h3 className="text-base font-medium mb-4 flex items-center gap-2">
            {category}
            <Badge variant="secondary">{categoryTools.length}</Badge>
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categoryTools.map((tool) => (
              <div
                key={tool.name}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{tool.displayName || tool.name}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(tool)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={tool.isEnabled ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        toggleMutation.mutate({
                          name: tool.name,
                          isEnabled: !tool.isEnabled,
                        })
                      }
                      disabled={toggleMutation.isPending}
                    >
                      {tool.isEnabled ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {tool.description}
                </p>
                {tool.usedByAgents?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tool.usedByAgents.slice(0, 3).map((agent) => (
                      <Badge key={agent} variant="outline" className="text-xs">
                        {agent}
                      </Badge>
                    ))}
                    {tool.usedByAgents.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{tool.usedByAgents.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                {tool.settings && Object.keys(tool.settings).length > 0 && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Has Settings
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edit Tool Dialog */}
      <Dialog open={!!editingTool} onOpenChange={(open) => !open && setEditingTool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tool: {editingTool?.displayName || editingTool?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tool Name</label>
              <Input value={editingTool?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <p className="text-sm text-muted-foreground">{editingTool?.description}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Settings (JSON)</label>
              <textarea
                className="w-full h-48 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none"
                placeholder="{}"
                value={settingsJson}
                onChange={(e) => {
                  setSettingsJson(e.target.value);
                  setJsonError("");
                }}
              />
              {jsonError && (
                <p className="text-sm text-destructive">{jsonError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Configure tool-specific settings in JSON format
              </p>
            </div>
            {editingTool?.usedByAgents && editingTool.usedByAgents.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Used By Agents</label>
                <div className="flex flex-wrap gap-1">
                  {editingTool.usedByAgents.map((agent) => (
                    <Badge key={agent} variant="outline">
                      {agent}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTool(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
