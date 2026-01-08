import apiClient from "./client";
import type { Project, ProjectListResponse } from "@/types";

export interface ProjectListParams {
  limit?: number;
  offset?: number;
  userId?: string;
}

export interface TransferOwnershipResponse {
  projectId: string;
  oldOwnerId: string;
  newOwnerId: string;
  transferredAt: string;
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
      projects: Project[];
      total: number;
    }>("/admin/projects", { params });
    return {
      projects: response.data.projects,
      total: response.data.total,
    };
  },

  adminDelete: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/admin/projects/${projectId}`);
  },

  transferOwnership: async (
    projectId: string,
    newOwnerId: string
  ): Promise<TransferOwnershipResponse> => {
    const response = await apiClient.post<TransferOwnershipResponse>(
      `/admin/projects/${projectId}/transfer`,
      { newOwnerId }
    );
    return response.data;
  },
};

