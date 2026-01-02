export interface Conversation {
  cid: string;
  userId?: string;
  title?: string;
  status: string;
  messageCount: number;
  fileCount: number;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationListResponse {
  items: Conversation[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface Message {
  id: string;
  cid: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  toolCalls?: ToolCall[];
  createdAt: string;
}

export interface ToolCall {
  id: string;
  name: string;
  type: "tool" | "subagent";
  args: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "running" | "success" | "error";
  durationMs?: number;
  error?: string;
}

export interface ConversationFile {
  path: string;
  language?: string;
  isBinary: boolean;
  fileSize?: number;
  downloadUrl?: string;
  updatedAt: string;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
  files: ConversationFile[];
}

