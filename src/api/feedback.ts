import apiClient from "./client";
import type {
  FeedbackListParams,
  FeedbackListResponse,
  FeedbackStatsParams,
  FeedbackStats,
  FeedbackDetail,
  FeedbackListItem,
} from "@/types/feedback";

// API response types (camelCase - matching actual API response)
interface FeedbackListItemApi {
  id: string;
  messageId: string;
  userId: string;
  projectId: string | null;
  feedbackType: "like" | "dislike";
  reason: string;
  modelName: string | null;
  createdAt: string;
}

interface FeedbackListResponseApi {
  feedbacks: FeedbackListItemApi[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

interface FeedbackStatsApi {
  totalCount: number;
  likeCount: number;
  dislikeCount: number;
  likeRatio: number;
  trend: Array<{
    date: string;
    likes: number;
    dislikes: number;
  }>;
  byModel: Array<{
    model: string;
    likes: number;
    dislikes: number;
  }>;
}

interface FeedbackDetailApi {
  id: string;
  messageId: string;
  userId: string;
  projectId: string | null;
  feedbackType: "like" | "dislike";
  reason: string;
  createdAt: string;
  modelName: string | null;
  modelVersion: string | null;
  userInput: string | null;
  assistantOutput: string | null;
  conversationHistory: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> | null;
  toolCallsUsed: Array<{
    name: string;
    type: string;
    status: string;
  }> | null;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
  } | null;
}

// Transform functions (API already returns camelCase, just add defaults)
function transformFeedbackItem(raw: FeedbackListItemApi): FeedbackListItem {
  return {
    id: raw.id || "",
    messageId: raw.messageId || "",
    userId: raw.userId || "",
    projectId: raw.projectId ?? null,
    feedbackType: raw.feedbackType || "like",
    reason: raw.reason || "",
    modelName: raw.modelName ?? null,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function transformStats(raw: FeedbackStatsApi): FeedbackStats {
  return {
    totalCount: raw.totalCount || 0,
    likeCount: raw.likeCount || 0,
    dislikeCount: raw.dislikeCount || 0,
    likeRatio: raw.likeRatio || 0,
    trend: (raw.trend || []).map((t) => ({
      date: t.date,
      likes: t.likes || 0,
      dislikes: t.dislikes || 0,
    })),
    byModel: (raw.byModel || []).map((m) => ({
      model: m.model || "",
      likes: m.likes || 0,
      dislikes: m.dislikes || 0,
    })),
  };
}

function transformDetail(raw: FeedbackDetailApi): FeedbackDetail {
  return {
    id: raw.id || "",
    messageId: raw.messageId || "",
    userId: raw.userId || "",
    projectId: raw.projectId ?? null,
    feedbackType: raw.feedbackType || "like",
    reason: raw.reason || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    modelName: raw.modelName ?? null,
    modelVersion: raw.modelVersion ?? null,
    userInput: raw.userInput ?? null,
    assistantOutput: raw.assistantOutput ?? null,
    conversationHistory: raw.conversationHistory ?? null,
    toolCallsUsed: raw.toolCallsUsed ?? null,
    tokenUsage: raw.tokenUsage
      ? {
          promptTokens: raw.tokenUsage.promptTokens || 0,
          completionTokens: raw.tokenUsage.completionTokens || 0,
        }
      : null,
  };
}

export const feedbackApi = {
  /**
   * Get feedback list with pagination and filters
   */
  list: async (params: FeedbackListParams = {}): Promise<FeedbackListResponse> => {
    const queryParams: Record<string, string | number> = {};
    
    if (params.type) queryParams.type = params.type;
    if (params.projectId) queryParams.projectId = params.projectId;
    if (params.model) queryParams.model = params.model;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.limit) queryParams.limit = params.limit;
    if (params.offset !== undefined) queryParams.offset = params.offset;

    const response = await apiClient.get<FeedbackListResponseApi>("/admin/feedbacks", {
      params: queryParams,
    });

    return {
      feedbacks: (response.data.feedbacks || []).map(transformFeedbackItem),
      total: response.data.total || 0,
      hasMore: response.data.hasMore || false,
      nextCursor: response.data.nextCursor ?? null,
    };
  },

  /**
   * Get aggregated statistics
   */
  getStats: async (params: FeedbackStatsParams = {}): Promise<FeedbackStats> => {
    const queryParams: Record<string, string> = {};
    
    if (params.projectId) queryParams.projectId = params.projectId;
    if (params.model) queryParams.model = params.model;
    if (params.period) queryParams.period = params.period;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    const response = await apiClient.get<FeedbackStatsApi>("/admin/feedbacks/stats", {
      params: queryParams,
    });

    return transformStats(response.data);
  },

  /**
   * Get single feedback detail with context
   */
  getDetail: async (feedbackId: string): Promise<FeedbackDetail> => {
    const response = await apiClient.get<FeedbackDetailApi>(
      `/admin/feedbacks/${feedbackId}`
    );
    return transformDetail(response.data);
  },
};
