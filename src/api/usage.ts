import apiClient from "./client";
import type {
  UserListResponse,
  UserListItem,
  TokenUsageSummary,
  DailyUsage,
  TopUser,
} from "@/types";

export interface UsageSummaryParams {
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DailyUsageParams {
  userId?: string;
  days?: number;
}

export interface TopUsersParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  days?: number;
}

export interface UserMessageUsage {
  userId: string;
  email: string;
  name?: string;
  messages: number;
  conversations: number;
}

export interface TopUsersByMessagesResponse {
  users: UserMessageUsage[];
  startDate: string;
  endDate: string;
}

export interface UserListParams {
  limit?: number;
  offset?: number;
  search?: string;
}

// Response type from admin/users endpoint (now uses camelCase)
interface AdminUserListResponse {
  users: Array<{
    id: string;
    email: string;
    name?: string;
    isAdmin: boolean;
    isBanned: boolean;
    totalTokens: number;
    totalCost: number;
    lastActiveAt?: string;
    createdAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface DashboardStatsResponse {
  totalUsers: number;
  totalProjects: number;
  totalConversations: number;
  userRegistrations: TrendDataPoint[];
  projectCreations: TrendDataPoint[];
  conversationCreations: TrendDataPoint[];
  days: number;
  startDate: string;
  endDate: string;
}

export const usageApi = {
  getDashboardStats: async (days: number = 30): Promise<DashboardStatsResponse> => {
    const response = await apiClient.get<DashboardStatsResponse>(
      "/admin/usage/dashboard-stats",
      { params: { days } }
    );
    return response.data;
  },

  // Use admin/users for user listing with details
  getUsers: async (params: UserListParams = {}): Promise<UserListResponse> => {
    // Try the new admin/users endpoint first, fallback to admin/usage/users
    try {
      const response = await apiClient.get<AdminUserListResponse>("/admin/users", {
        params,
      });
      // Transform response format (map id to userId for frontend compatibility)
      return {
        users: response.data.users?.map((u): UserListItem => ({
          userId: u.id,
          email: u.email,
          name: u.name,
          isAdmin: u.isAdmin || false,
          totalTokens: u.totalTokens || 0,
          totalCost: u.totalCost || 0,
          lastActiveAt: u.lastActiveAt,
          status: u.isBanned ? "banned" as const : "active" as const,
        })) || [],
        total: response.data.total || 0,
        limit: response.data.limit || params.limit || 20,
        offset: response.data.offset || params.offset || 0,
      };
    } catch {
      // Fallback to usage endpoint
      const response = await apiClient.get<UserListResponse>("/admin/usage/users", {
        params,
      });
      return response.data;
    }
  },

  getSummary: async (params: UsageSummaryParams = {}): Promise<TokenUsageSummary> => {
    const response = await apiClient.get<TokenUsageSummary>("/admin/usage/summary", {
      params: {
        userId: params.userId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });
    return response.data;
  },

  getDailyUsage: async (params: DailyUsageParams = {}): Promise<{ dailyUsage: DailyUsage[] }> => {
    const response = await apiClient.get<{ dailyUsage: DailyUsage[] }>("/admin/usage/daily", {
      params: {
        userId: params.userId,
        days: params.days || 30,
      },
    });
    return response.data;
  },

  getTopUsers: async (params: TopUsersParams = {}): Promise<{ users: TopUser[]; startDate: string; endDate: string }> => {
    const response = await apiClient.get<{ users: TopUser[]; startDate: string; endDate: string }>(
      "/admin/usage/top-users",
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          limit: params.limit || 20,
        },
      }
    );
    return response.data;
  },

  getTopUsersByMessages: async (params: TopUsersParams = {}): Promise<TopUsersByMessagesResponse> => {
    const response = await apiClient.get<TopUsersByMessagesResponse>(
      "/admin/usage/top-users-by-messages",
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          limit: params.limit || 20,
        },
      }
    );
    return response.data;
  },
};
