import apiClient from "./client";
import type { Conversation, Message, ConversationFile } from "@/types";

export interface ConversationListParams {
  limit?: number;
  offset?: number;
  projectId?: string;
  userId?: string;
  status?: string;
  hasFiles?: boolean;
}

export interface ConversationListResponse {
  items: Conversation[];
  total: number;
}

export interface ConversationDetailResponse {
  conversation: Conversation;
  messages: Message[];
  files: ConversationFile[];
}

interface ConversationListApiResponse {
  items: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

interface ConversationDetailApiResponse {
  cid: string;
  userId: string;
  projectId?: string;
  title?: string;
  status: string;
  messageCount: number;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
  files: ConversationFile[];
  createdAt: string;
  updatedAt: string;
}

export const conversationsApi = {
  list: async (params: ConversationListParams = {}): Promise<ConversationListResponse> => {
    const response = await apiClient.get<ConversationListApiResponse>(
      "/admin/conversations",
      { params }
    );
    return {
      items: response.data.items,
      total: response.data.total,
    };
  },

  get: async (cid: string): Promise<ConversationDetailResponse> => {
    const response = await apiClient.get<ConversationDetailApiResponse>(
      `/admin/conversations/${cid}`
    );

    const data = response.data;
    const files = data.files || [];
    return {
      conversation: {
        cid: data.cid,
        userId: data.userId,
        title: data.title,
        status: data.status,
        messageCount: data.messageCount,
        fileCount: files.length,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      messages: data.messages.map((m) => ({
        id: m.id,
        cid: data.cid,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        createdAt: m.createdAt,
      })),
      files,
    };
  },

  getMessages: async (cid: string): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>(`/conversations/${cid}/messages`);
    return response.data;
  },

  delete: async (cid: string): Promise<void> => {
    await apiClient.delete(`/admin/conversations/${cid}`);
  },
};
