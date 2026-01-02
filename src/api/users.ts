import apiClient from "./client";

export interface UserDetail {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  adminLevel: number;
  isBanned: boolean;
  banReason?: string;
  bannedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BanUserRequest {
  reason?: string;
}

export interface BanUserResponse {
  userId: string;
  isBanned: boolean;
  banReason?: string;
  bannedAt?: string;
}

export const usersApi = {
  getDetail: async (userId: string): Promise<UserDetail> => {
    const response = await apiClient.get<{
      id: string;
      email: string;
      name?: string;
      is_admin: boolean;
      admin_level: number;
      is_banned: boolean;
      ban_reason?: string;
      banned_at?: string;
      created_at: string;
      updated_at?: string;
    }>(`/admin/users/${userId}`);
    const data = response.data;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      isAdmin: data.is_admin,
      adminLevel: data.admin_level,
      isBanned: data.is_banned,
      banReason: data.ban_reason,
      bannedAt: data.banned_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  update: async (
    userId: string,
    data: { name?: string; email?: string }
  ): Promise<UserDetail> => {
    const response = await apiClient.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  ban: async (userId: string, reason?: string): Promise<BanUserResponse> => {
    const response = await apiClient.post<{
      user_id: string;
      is_banned: boolean;
      ban_reason?: string;
      banned_at?: string;
    }>(`/admin/users/${userId}/ban`, { reason });
    return {
      userId: response.data.user_id,
      isBanned: response.data.is_banned,
      banReason: response.data.ban_reason,
      bannedAt: response.data.banned_at,
    };
  },

  unban: async (userId: string): Promise<BanUserResponse> => {
    const response = await apiClient.post<{
      user_id: string;
      is_banned: boolean;
      ban_reason?: string;
      banned_at?: string;
    }>(`/admin/users/${userId}/unban`);
    return {
      userId: response.data.user_id,
      isBanned: response.data.is_banned,
      banReason: response.data.ban_reason,
      bannedAt: response.data.banned_at,
    };
  },
};

