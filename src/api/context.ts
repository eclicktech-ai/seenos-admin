import apiClient from "./client";

export interface ContextStats {
  singletons: number;
  items: number;
  persons: number;
  entities: number;
  knowledgeSources: number;
  totalSize: number;
}

export interface ProjectContextStats {
  projectId: string;
  projectName: string;
  ownerId: string;
  ownerEmail?: string;
  stats: ContextStats;
}

export interface ContextDetailItem {
  id: string;
  section: string;
  category?: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface KnowledgeSourceItem {
  id: string;
  title: string;
  sourceType: string;
  url?: string;
  filePath?: string;
  createdAt: string;
}

export interface ProjectContextDetail {
  projectId: string;
  projectName: string;
  ownerId: string;
  ownerEmail?: string;
  singletons: ContextDetailItem[];
  items: ContextDetailItem[];
  persons: ContextDetailItem[];
  entities: ContextDetailItem[];
  knowledgeSources: KnowledgeSourceItem[];
}

export const contextApi = {
  // Get stats for a specific project (admin endpoint)
  getStats: async (projectId: string): Promise<ContextStats> => {
    const response = await apiClient.get<{
      singletons: number;
      items: number;
      persons: number;
      entities: number;
      knowledge_sources: number;
    }>(`/admin/context/projects/${projectId}/stats`);
    return {
      singletons: response.data.singletons,
      items: response.data.items,
      persons: response.data.persons,
      entities: response.data.entities,
      knowledgeSources: response.data.knowledge_sources,
      totalSize: 0,
    };
  },

  clearContext: async (projectId: string, includeAudit = false): Promise<{ deleted: Record<string, number> }> => {
    const response = await apiClient.delete<{ deleted: Record<string, number> }>(`/admin/context/projects/${projectId}`, {
      params: { include_audit: includeAudit },
    });
    return response.data;
  },

  // Get all context stats across projects (admin only)
  getAllStats: async (): Promise<ProjectContextStats[]> => {
    const response = await apiClient.get<{
      projects: Array<{
        project_id: string;
        project_name: string;
        owner_id: string;
        stats: {
          singletons: number;
          items: number;
          persons: number;
          entities: number;
          knowledge_sources: number;
        };
      }>;
      totals: ContextStats;
    }>("/admin/context/stats");
    return response.data.projects.map((p) => ({
      projectId: p.project_id,
      projectName: p.project_name,
      ownerId: p.owner_id,
      stats: {
        singletons: p.stats.singletons,
        items: p.stats.items,
        persons: p.stats.persons,
        entities: p.stats.entities,
        knowledgeSources: p.stats.knowledge_sources,
        totalSize: 0, // Not provided by API
      },
    }));
  },

  // Get detailed context for a project
  getProjectDetails: async (projectId: string): Promise<ProjectContextDetail> => {
    const response = await apiClient.get<{
      project_id: string;
      project_name: string;
      owner_id: string;
      owner_email?: string;
      singletons: Array<{
        id: string;
        section: string;
        category?: string;
        data: Record<string, unknown>;
        created_at: string;
        updated_at?: string;
      }>;
      items: Array<{
        id: string;
        section: string;
        category?: string;
        data: Record<string, unknown>;
        created_at: string;
        updated_at?: string;
      }>;
      persons: Array<{
        id: string;
        section: string;
        category?: string;
        data: Record<string, unknown>;
        created_at: string;
        updated_at?: string;
      }>;
      entities: Array<{
        id: string;
        section: string;
        category?: string;
        data: Record<string, unknown>;
        created_at: string;
        updated_at?: string;
      }>;
      knowledge_sources: Array<{
        id: string;
        title: string;
        source_type: string;
        url?: string;
        file_path?: string;
        created_at: string;
      }>;
    }>(`/admin/context/projects/${projectId}/details`);

    const d = response.data;
    return {
      projectId: d.project_id,
      projectName: d.project_name,
      ownerId: d.owner_id,
      ownerEmail: d.owner_email,
      singletons: d.singletons.map((s) => ({
        id: s.id,
        section: s.section,
        category: s.category,
        data: s.data,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
      items: d.items.map((i) => ({
        id: i.id,
        section: i.section,
        category: i.category,
        data: i.data,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
      })),
      persons: d.persons.map((p) => ({
        id: p.id,
        section: p.section,
        category: p.category,
        data: p.data,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
      entities: d.entities.map((e) => ({
        id: e.id,
        section: e.section,
        category: e.category,
        data: e.data,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      })),
      knowledgeSources: d.knowledge_sources.map((ks) => ({
        id: ks.id,
        title: ks.title,
        sourceType: ks.source_type,
        url: ks.url,
        filePath: ks.file_path,
        createdAt: ks.created_at,
      })),
    };
  },
};

