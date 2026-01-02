import apiClient from "./client";
import type { Project, ProjectListResponse } from "@/types";

export interface ProjectListParams {
  limit?: number;
  offset?: number;
  userId?: string;
}

export const projectsApi = {
  list: async (params: ProjectListParams = {}): Promise<ProjectListResponse> => {
    const response = await apiClient.get<Project[]>("/projects", {
      params,
    });
    // Backend returns array directly for user's projects
    // For admin view, we may need to adapt this
    const projects = Array.isArray(response.data) ? response.data : [];
    return {
      projects,
      total: projects.length,
    };
  },

  get: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${projectId}`);
    return response.data;
  },

  delete: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}`);
  },

  // Admin-specific endpoints
  adminList: async (params: ProjectListParams = {}): Promise<ProjectListResponse> => {
    const response = await apiClient.get<{
      projects: Array<{
        id: string;
        name: string;
        domain?: string;
        owner_id: string;
        owner_email: string;
        onboarding_status?: string;
        research_status?: string;
        current_step?: string;
        created_at: string;
        updated_at: string;
      }>;
      total: number;
    }>("/admin/projects", { params });
    return {
      projects: response.data.projects.map((p) => ({
        id: p.id,
        userId: p.owner_id,
        ownerEmail: p.owner_email,
        name: p.name,
        domain: p.domain,
        onboardingStatus: p.onboarding_status,
        researchStatus: p.research_status,
        currentStep: p.current_step,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
      total: response.data.total,
    };
  },

  adminDelete: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/admin/projects/${projectId}`);
  },

  transferOwnership: async (
    projectId: string,
    newOwnerId: string
  ): Promise<{ projectId: string; oldOwnerId: string; newOwnerId: string }> => {
    const response = await apiClient.post(`/admin/projects/${projectId}/transfer`, {
      new_owner_id: newOwnerId,
    });
    return response.data;
  },
};

