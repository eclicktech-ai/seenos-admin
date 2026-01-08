import apiClient from "./client";
import type {
  SessionItem,
  SessionListResponse,
  SessionStats,
  UserDurationRankItem,
  DurationRankingResponse,
  DailySessionStats,
  SessionTrendsResponse,
} from "@/types/session";

export interface SessionListParams {
  limit?: number;
  offset?: number;
  userId?: string;
  status?: "active" | "ended";
  deviceType?: string;
  days?: number;
}

export interface SessionStatsParams {
  days?: number;
}

export interface RankingParams {
  limit?: number;
  days?: number;
}

export interface TrendsParams {
  days?: number;
}

export const sessionsApi = {
  /**
   * List all sessions with filtering and pagination
   */
  list: async (params: SessionListParams = {}): Promise<SessionListResponse> => {
    const response = await apiClient.get<{
      sessions: SessionItem[];
      total: number;
      limit: number;
      offset: number;
    }>("/admin/sessions", {
      params: {
        limit: params.limit,
        offset: params.offset,
        userId: params.userId,
        status: params.status,
        deviceType: params.deviceType,
        days: params.days,
      },
    });

    return {
      sessions: response.data.sessions || [],
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  },

  /**
   * Get session statistics
   */
  getStats: async (params: SessionStatsParams = {}): Promise<SessionStats> => {
    const response = await apiClient.get<SessionStats>("/admin/sessions/stats", {
      params: { days: params.days },
    });
    return response.data;
  },

  /**
   * Get user duration ranking
   */
  getRanking: async (params: RankingParams = {}): Promise<DurationRankingResponse> => {
    const response = await apiClient.get<{
      users: UserDurationRankItem[];
      total: number;
      since?: string;
    }>("/admin/sessions/ranking", {
      params: {
        limit: params.limit,
        days: params.days,
      },
    });

    return {
      users: response.data.users || [],
      total: response.data.total,
      since: response.data.since,
    };
  },

  /**
   * Get session trends for charts
   */
  getTrends: async (params: TrendsParams = {}): Promise<SessionTrendsResponse> => {
    const response = await apiClient.get<{
      dailyStats: DailySessionStats[];
      days: number;
    }>("/admin/sessions/trends", {
      params: { days: params.days },
    });

    return {
      dailyStats: response.data.dailyStats || [],
      days: response.data.days,
    };
  },

  /**
   * End a session (admin action)
   */
  endSession: async (sessionId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/admin/sessions/${sessionId}`);
    return response.data;
  },
};

