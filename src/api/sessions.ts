import apiClient from "./client";
import type {
  SessionListResponse,
  SessionStats,
  DurationRankingResponse,
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

// Transform snake_case to camelCase
function transformSession(data: Record<string, unknown>) {
  return {
    id: data.id,
    userId: data.user_id,
    userEmail: data.user_email,
    userName: data.user_name,
    deviceType: data.device_type,
    startedAt: data.started_at,
    lastActivityAt: data.last_activity_at,
    endedAt: data.ended_at,
    durationSeconds: data.duration_seconds,
    pageViews: data.page_views,
    messageCount: data.message_count,
    ipAddress: data.ip_address,
  };
}

function transformRankItem(data: Record<string, unknown>) {
  return {
    userId: data.user_id,
    email: data.email,
    name: data.name,
    totalDurationSeconds: data.total_duration_seconds,
    totalDurationFormatted: data.total_duration_formatted,
    sessionCount: data.session_count,
    avgDurationSeconds: data.avg_duration_seconds,
    lastSessionAt: data.last_session_at,
  };
}

function transformDailyStats(data: Record<string, unknown>) {
  return {
    date: data.date,
    sessionCount: data.session_count,
    uniqueUsers: data.unique_users,
    totalDurationHours: data.total_duration_hours,
  };
}

export const sessionsApi = {
  /**
   * List all sessions with filtering and pagination
   */
  list: async (params: SessionListParams = {}): Promise<SessionListResponse> => {
    const response = await apiClient.get("/admin/sessions", {
      params: {
        limit: params.limit,
        offset: params.offset,
        user_id: params.userId,
        status: params.status,
        device_type: params.deviceType,
        days: params.days,
      },
    });

    return {
      sessions: (response.data.sessions || []).map(transformSession),
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  },

  /**
   * Get session statistics
   */
  getStats: async (params: SessionStatsParams = {}): Promise<SessionStats> => {
    const response = await apiClient.get("/admin/sessions/stats", {
      params: { days: params.days },
    });

    const data = response.data;
    return {
      totalSessions: data.total_sessions,
      activeSessions: data.active_sessions,
      totalDurationHours: data.total_duration_hours,
      avgDurationMinutes: data.avg_duration_minutes,
      totalPageViews: data.total_page_views,
      totalMessages: data.total_messages,
      uniqueUsers: data.unique_users,
    };
  },

  /**
   * Get user duration ranking
   */
  getRanking: async (params: RankingParams = {}): Promise<DurationRankingResponse> => {
    const response = await apiClient.get("/admin/sessions/ranking", {
      params: {
        limit: params.limit,
        days: params.days,
      },
    });

    return {
      users: (response.data.users || []).map(transformRankItem),
      total: response.data.total,
      since: response.data.since,
    };
  },

  /**
   * Get session trends for charts
   */
  getTrends: async (params: TrendsParams = {}): Promise<SessionTrendsResponse> => {
    const response = await apiClient.get("/admin/sessions/trends", {
      params: { days: params.days },
    });

    return {
      dailyStats: (response.data.daily_stats || []).map(transformDailyStats),
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

