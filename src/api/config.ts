import apiClient from "./client";
import type {
  AgentConfig,
  OrchestratorConfig,
  ToolConfig,
  InviteCode,
  AdminUser,
  Playbook,
  ModelsGroupedResponse,
  ModelDefaults,
} from "@/types";

// Agent APIs
export const agentsApi = {
  list: async (): Promise<AgentConfig[]> => {
    const response = await apiClient.get<AgentConfig[]>("/config/agents");
    return response.data;
  },

  get: async (name: string): Promise<AgentConfig> => {
    const response = await apiClient.get<AgentConfig>(`/config/agents/${name}`);
    return response.data;
  },

  update: async (
    name: string,
    data: Partial<{
      isEnabled: boolean;
      modelId: string;
      systemPrompt: string;
      tools: string[];
      description: string;
    }>
  ): Promise<AgentConfig> => {
    const response = await apiClient.put<AgentConfig>(`/config/agents/${name}`, data);
    return response.data;
  },

  toggle: async (name: string, isEnabled: boolean): Promise<AgentConfig> => {
    const response = await apiClient.patch<AgentConfig>(`/config/agents/${name}/toggle`, {
      isEnabled,
    });
    return response.data;
  },

  reset: async (name: string): Promise<void> => {
    await apiClient.delete(`/config/agents/${name}`);
  },
};

// Orchestrator APIs
export const orchestratorApi = {
  get: async (): Promise<OrchestratorConfig> => {
    const response = await apiClient.get<OrchestratorConfig>("/config/orchestrator");
    return response.data;
  },

  update: async (
    data: Partial<{
      modelId: string;
      systemPrompt: string;
      tools: string[];
    }>
  ): Promise<OrchestratorConfig> => {
    const response = await apiClient.put<OrchestratorConfig>("/config/orchestrator", data);
    return response.data;
  },

  reset: async (): Promise<void> => {
    await apiClient.delete("/config/orchestrator");
  },
};

// Tool APIs
export const toolsApi = {
  list: async (): Promise<ToolConfig[]> => {
    const response = await apiClient.get<ToolConfig[]>("/config/tools");
    return response.data;
  },

  update: async (
    name: string,
    data: Partial<{
      isEnabled: boolean;
      settings: Record<string, unknown>;
    }>
  ): Promise<ToolConfig> => {
    const response = await apiClient.put<ToolConfig>(`/config/tools/${name}`, data);
    return response.data;
  },

  toggle: async (name: string, isEnabled: boolean): Promise<ToolConfig> => {
    const response = await apiClient.patch<ToolConfig>(`/config/tools/${name}/toggle`, {
      isEnabled,
    });
    return response.data;
  },
};

// Invite Code APIs
export interface InviteCodeUsage {
  userId: string;
  email: string;
  name?: string;
  usedAt: string;
}

export const inviteCodesApi = {
  list: async (activeOnly = false): Promise<{ codes: InviteCode[]; total: number }> => {
    const response = await apiClient.get<{ codes: InviteCode[]; total: number }>("/invite-codes", {
      params: { active_only: activeOnly },
    });
    return response.data;
  },

  create: async (data: {
    code?: string;
    maxUses?: number;
    expiresInDays?: number;
    note?: string;
  }): Promise<InviteCode> => {
    const response = await apiClient.post<InviteCode>("/invite-codes", data);
    return response.data;
  },

  get: async (id: string): Promise<InviteCode> => {
    const response = await apiClient.get<InviteCode>(`/invite-codes/${id}`);
    return response.data;
  },

  update: async (id: string, data: {
    maxUses?: number;
    note?: string;
    expiresInDays?: number;
  }): Promise<InviteCode> => {
    const response = await apiClient.put<InviteCode>(`/invite-codes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invite-codes/${id}`);
  },

  deactivate: async (id: string): Promise<InviteCode> => {
    const response = await apiClient.patch<InviteCode>(`/invite-codes/${id}/deactivate`);
    return response.data;
  },

  activate: async (id: string): Promise<InviteCode> => {
    const response = await apiClient.patch<InviteCode>(`/invite-codes/${id}/activate`);
    return response.data;
  },

  getUsages: async (id: string): Promise<{ usages: InviteCodeUsage[]; total: number }> => {
    const response = await apiClient.get<{ usages: InviteCodeUsage[]; total: number }>(
      `/invite-codes/${id}/usages`
    );
    return response.data;
  },
};

// Admin Users APIs
export const adminsApi = {
  list: async (): Promise<{ admins: AdminUser[]; total: number }> => {
    const response = await apiClient.get<{ admins: AdminUser[]; total: number }>("/config/admins");
    return response.data;
  },

  grant: async (data: {
    userId: string;
    level?: number;
    note?: string;
  }): Promise<AdminUser> => {
    const response = await apiClient.post<AdminUser>("/config/admins", data);
    return response.data;
  },

  update: async (
    userId: string,
    data: { level?: number; note?: string }
  ): Promise<AdminUser> => {
    const response = await apiClient.patch<AdminUser>(`/config/admins/${userId}`, data);
    return response.data;
  },

  revoke: async (userId: string): Promise<void> => {
    await apiClient.delete(`/config/admins/${userId}`);
  },

  searchUsers: async (email?: string): Promise<{ users: Array<{ userId: string; email: string; name?: string }> }> => {
    const response = await apiClient.get<{ users: Array<{ userId: string; email: string; name?: string }> }>(
      "/config/admins/search",
      { params: { email } }
    );
    return response.data;
  },
};

// Playbooks APIs
export const playbooksApi = {
  list: async (category?: string, activeOnly = true): Promise<{
    categories: Array<{
      category: string;
      categoryName: string;
      playbooks: Playbook[];
    }>;
    total: number;
  }> => {
    const response = await apiClient.get("/playbooks", {
      params: { category, active_only: activeOnly },
    });
    return response.data;
  },

  get: async (id: string): Promise<Playbook> => {
    const response = await apiClient.get<Playbook>(`/playbooks/${id}`);
    return response.data;
  },

  create: async (data: Partial<Playbook>): Promise<Playbook> => {
    const response = await apiClient.post<Playbook>("/playbooks", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Playbook>): Promise<Playbook> => {
    const response = await apiClient.put<Playbook>(`/playbooks/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/playbooks/${id}`);
  },

  syncFromSkills: async (overwrite = false): Promise<{
    created: number;
    updated: number;
    skipped: number;
    totalSkills: number;
  }> => {
    const response = await apiClient.post("/playbooks/sync-from-skills", { overwrite });
    return response.data;
  },
};

// Models APIs
export const modelsApi = {
  /**
   * Get available models grouped by provider
   */
  grouped: async (): Promise<ModelsGroupedResponse> => {
    const response = await apiClient.get<ModelsGroupedResponse>("/models/grouped");
    return response.data;
  },

  /**
   * Get default model recommendations
   */
  defaults: async (): Promise<ModelDefaults> => {
    const response = await apiClient.get<ModelDefaults>("/models/defaults");
    return response.data;
  },
};

