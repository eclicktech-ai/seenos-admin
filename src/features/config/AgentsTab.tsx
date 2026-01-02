import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Check, X, RotateCcw, Pencil, Settings } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ModelSelect } from "@/components/shared/ModelSelect";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { agentsApi, orchestratorApi } from "@/api/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentConfig } from "@/types";

export function AgentsTab() {
  const queryClient = useQueryClient();
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [editForm, setEditForm] = useState({
    modelId: "",
    description: "",
    systemPrompt: "",
  });

  // Orchestrator edit state
  const [editingOrchestrator, setEditingOrchestrator] = useState(false);
  const [orchestratorForm, setOrchestratorForm] = useState({
    modelId: "",
    systemPrompt: "",
  });

  const { data: agents, isLoading } = useQuery({
    queryKey: ["config", "agents"],
    queryFn: () => agentsApi.list(),
  });

  const { data: orchestrator, isLoading: orchestratorLoading } = useQuery({
    queryKey: ["config", "orchestrator"],
    queryFn: () => orchestratorApi.get(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ name, isEnabled }: { name: string; isEnabled: boolean }) =>
      agentsApi.toggle(name, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "agents"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: Partial<AgentConfig> }) =>
      agentsApi.update(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "agents"] });
      setEditingAgent(null);
      toast.success("Agent updated successfully");
    },
    onError: (err) => {
      toast.error(`Failed to update agent: ${(err as Error).message}`);
    },
  });

  const resetAgentMutation = useMutation({
    mutationFn: (name: string) => agentsApi.reset(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "agents"] });
      toast.success("Agent reset to defaults");
    },
  });

  const updateOrchestratorMutation = useMutation({
    mutationFn: (data: { modelId?: string; systemPrompt?: string }) =>
      orchestratorApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "orchestrator"] });
      setEditingOrchestrator(false);
      toast.success("Orchestrator updated successfully");
    },
    onError: (err) => {
      toast.error(`Failed to update orchestrator: ${(err as Error).message}`);
    },
  });

  const resetOrchestratorMutation = useMutation({
    mutationFn: () => orchestratorApi.reset(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "orchestrator"] });
      toast.success("Orchestrator reset to defaults");
    },
  });

  const openEditDialog = (agent: AgentConfig) => {
    setEditingAgent(agent);
    setEditForm({
      modelId: agent.modelId || "",
      description: agent.description || "",
      systemPrompt: agent.systemPrompt || "",
    });
  };

  const openOrchestratorEdit = () => {
    setOrchestratorForm({
      modelId: orchestrator?.modelId || "",
      systemPrompt: orchestrator?.systemPrompt || "",
    });
    setEditingOrchestrator(true);
  };

  const handleSave = () => {
    if (!editingAgent) return;
    updateMutation.mutate({
      name: editingAgent.name,
      data: {
        modelId: editForm.modelId,
        description: editForm.description,
        systemPrompt: editForm.systemPrompt,
      },
    });
  };

  const handleSaveOrchestrator = () => {
    updateOrchestratorMutation.mutate({
      modelId: orchestratorForm.modelId || undefined,
      systemPrompt: orchestratorForm.systemPrompt || undefined,
    });
  };

  if (isLoading || orchestratorLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Orchestrator Config */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Orchestrator Config</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openOrchestratorEdit}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetOrchestratorMutation.mutate()}
              disabled={resetOrchestratorMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium font-mono">{orchestrator?.modelId || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Enabled Subagents</p>
              <p className="font-medium">
                {orchestrator?.enabledSubagentCount || 0} / {orchestrator?.subagents?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tools Count</p>
              <p className="font-medium">{orchestrator?.tools?.length || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Overrides</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {orchestrator?.isModelOverridden && <Badge variant="outline">Model</Badge>}
                {orchestrator?.isPromptOverridden && <Badge variant="outline">Prompt</Badge>}
                {orchestrator?.isToolsOverridden && <Badge variant="outline">Tools</Badge>}
                {!orchestrator?.isModelOverridden && !orchestrator?.isPromptOverridden && !orchestrator?.isToolsOverridden && (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents List */}
      <div>
        <h3 className="text-base font-medium mb-4">Subagent List</h3>
        {!agents?.length ? (
          <EmptyState
            icon={Bot}
            title="No Agent Config"
            description="Agent configuration will be displayed here"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{agent.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {agent.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(agent)}
                      title="Edit Agent"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={agent.isEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        toggleMutation.mutate({
                          name: agent.name,
                          isEnabled: !agent.isEnabled,
                        })
                      }
                      disabled={toggleMutation.isPending}
                    >
                      {agent.isEnabled ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Disabled
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {agent.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="font-mono">Model: {agent.modelId}</span>
                  <span>·</span>
                  <span>{agent.toolCount} Tools</span>
                  {(agent.isModelOverridden || agent.isPromptOverridden || agent.isDescriptionOverridden) && (
                    <>
                      <span>·</span>
                      <Badge variant="secondary" className="text-xs">
                        Overridden
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Agent Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Agent: {editingAgent?.name}</DialogTitle>
            <DialogDescription>
              Modify the agent configuration. Leave fields empty to use default values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <ModelSelect
                value={editForm.modelId}
                onValueChange={(value) => setEditForm({ ...editForm, modelId: value })}
                placeholder="Select model..."
                showDefault={true}
                defaultLabel="Use Default Model"
              />
              <p className="text-xs text-muted-foreground">
                Select a model or leave as default
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Agent description..."
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">System Prompt</label>
              <textarea
                className="w-full h-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="System prompt..."
                value={editForm.systemPrompt}
                onChange={(e) => setEditForm({ ...editForm, systemPrompt: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default prompt
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (editingAgent && confirm("Reset this agent to defaults?")) {
                  resetAgentMutation.mutate(editingAgent.name);
                  setEditingAgent(null);
                }
              }}
              disabled={resetAgentMutation.isPending}
            >
              Reset to Default
            </Button>
            <Button variant="outline" onClick={() => setEditingAgent(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Orchestrator Dialog */}
      <Dialog open={editingOrchestrator} onOpenChange={setEditingOrchestrator}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Edit Orchestrator Config
            </DialogTitle>
            <DialogDescription>
              Modify the orchestrator configuration. Leave fields empty to use default values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <ModelSelect
                value={orchestratorForm.modelId}
                onValueChange={(value) => setOrchestratorForm({ ...orchestratorForm, modelId: value })}
                placeholder="Select model..."
                showDefault={true}
                defaultLabel="Use Default Model"
              />
              <p className="text-xs text-muted-foreground">
                Select the model for the main orchestrator
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">System Prompt</label>
              <textarea
                className="w-full h-60 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="System prompt for the orchestrator..."
                value={orchestratorForm.systemPrompt}
                onChange={(e) => setOrchestratorForm({ ...orchestratorForm, systemPrompt: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default prompt
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Reset orchestrator to defaults?")) {
                  resetOrchestratorMutation.mutate();
                  setEditingOrchestrator(false);
                }
              }}
              disabled={resetOrchestratorMutation.isPending}
            >
              Reset to Default
            </Button>
            <Button variant="outline" onClick={() => setEditingOrchestrator(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrchestrator} disabled={updateOrchestratorMutation.isPending}>
              {updateOrchestratorMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
