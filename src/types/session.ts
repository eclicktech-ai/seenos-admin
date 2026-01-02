// Session Types for Admin Dashboard

export interface SessionItem {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  deviceType?: string;
  startedAt: string;
  lastActivityAt: string;
  endedAt?: string;
  durationSeconds?: number;
  pageViews: number;
  messageCount: number;
  ipAddress?: string;
}

export interface SessionListResponse {
  sessions: SessionItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  totalDurationHours: number;
  avgDurationMinutes: number;
  totalPageViews: number;
  totalMessages: number;
  uniqueUsers: number;
}

export interface UserDurationRankItem {
  userId: string;
  email: string;
  name?: string;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
  sessionCount: number;
  avgDurationSeconds: number;
  lastSessionAt?: string;
}

export interface DurationRankingResponse {
  users: UserDurationRankItem[];
  total: number;
  since?: string;
}

export interface DailySessionStats {
  date: string;
  sessionCount: number;
  uniqueUsers: number;
  totalDurationHours: number;
}

export interface SessionTrendsResponse {
  dailyStats: DailySessionStats[];
  days: number;
}

