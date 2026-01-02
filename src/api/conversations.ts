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

export const conversationsApi = {
  list: async (params: ConversationListParams = {}): Promise<ConversationListResponse> => {
    const response = await apiClient.get<{
      items: Array<{
        cid: string;
        user_id: string;
        project_id?: string;
        title?: string;
        status: string;
        message_count: number;
        file_count: number;
        created_at: string;
        updated_at: string;
      }>;
      total: number;
      limit: number;
      offset: number;
    }>("/admin/conversations", { params });
    return {
      items: response.data.items.map((c) => ({
        cid: c.cid,
        userId: c.user_id,
        title: c.title,
        status: c.status,
        messageCount: c.message_count,
        fileCount: c.file_count || 0,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
      total: response.data.total,
    };
  },

  get: async (cid: string): Promise<ConversationDetailResponse> => {
    const response = await apiClient.get<{
      cid: string;
      user_id: string;
      project_id?: string;
      title?: string;
      status: string;
      message_count: number;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        created_at: string;
      }>;
      files: Array<{
        path: string;
        language?: string;
        is_binary: boolean;
        file_size?: number;
        download_url?: string;
        updated_at: string;
      }>;
      created_at: string;
      updated_at: string;
    }>(`/admin/conversations/${cid}`);
    
    const data = response.data;
    const files = data.files || [];
    return {
      conversation: {
        cid: data.cid,
        userId: data.user_id,
        title: data.title,
        status: data.status,
        messageCount: data.message_count,
        fileCount: files.length,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      messages: data.messages.map((m) => ({
        id: m.id,
        cid: data.cid,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        createdAt: m.created_at,
      })),
      files: files.map((f) => ({
        path: f.path,
        language: f.language,
        isBinary: f.is_binary,
        fileSize: f.file_size,
        downloadUrl: f.download_url,
        updatedAt: f.updated_at,
      })),
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
