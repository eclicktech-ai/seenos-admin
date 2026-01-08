// ==================== 枚举类型 ====================

export type FeedbackType = "like" | "dislike";

export type TrendPeriod = "day" | "week" | "month";

// ==================== 列表项 ====================

export interface FeedbackListItem {
  id: string;
  messageId: string;
  userId: string;
  projectId: string | null;
  feedbackType: FeedbackType;
  reason: string;
  modelName: string | null;
  createdAt: string;
}

export interface FeedbackListResponse {
  feedbacks: FeedbackListItem[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

// ==================== 统计数据 ====================

export interface TrendDataPoint {
  date: string;
  likes: number;
  dislikes: number;
}

export interface ModelStats {
  model: string;
  likes: number;
  dislikes: number;
}

export interface FeedbackStats {
  totalCount: number;
  likeCount: number;
  dislikeCount: number;
  likeRatio: number;
  trend: TrendDataPoint[];
  byModel: ModelStats[];
}

// ==================== 详情（含上下文） ====================

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ToolCallInfo {
  name: string;
  type: string;
  status: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface FeedbackDetail {
  id: string;
  messageId: string;
  userId: string;
  projectId: string | null;
  feedbackType: FeedbackType;
  reason: string;
  createdAt: string;
  modelName: string | null;
  modelVersion: string | null;
  userInput: string | null;
  assistantOutput: string | null;
  conversationHistory: ConversationMessage[] | null;
  toolCallsUsed: ToolCallInfo[] | null;
  tokenUsage: TokenUsage | null;
}

// ==================== 请求参数 ====================

export interface FeedbackListParams {
  type?: FeedbackType;
  projectId?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface FeedbackStatsParams {
  projectId?: string;
  model?: string;
  period?: TrendPeriod;
  startDate?: string;
  endDate?: string;
}
