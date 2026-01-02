export interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserListItem {
  userId: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  totalTokens: number;
  totalCost: number;
  lastActiveAt?: string;
  status?: "active" | "banned";
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface TokenUsageSummary {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  callCount: number;
  byModel: Record<string, ModelUsage>;
  bySource: Record<string, SourceUsage>;
}

export interface ModelUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  callCount: number;
}

export interface SourceUsage {
  totalTokens: number;
  cost: number;
  callCount: number;
}

export interface DailyUsage {
  date: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  callCount: number;
}

export interface TopUser {
  userId: string;
  email: string;
  name?: string;
  totalTokens: number;
  totalCost: number;
  callCount: number;
}

