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
    const response = await apiClient.get<UserDetail>(`/admin/users/${userId}`);
    return response.data;
  },

  update: async (
    userId: string,
    data: { name?: string; email?: string }
  ): Promise<UserDetail> => {
    const response = await apiClient.put<UserDetail>(`/admin/users/${userId}`, data);
    return response.data;
  },

  ban: async (userId: string, reason?: string): Promise<BanUserResponse> => {
    const response = await apiClient.post<BanUserResponse>(
      `/admin/users/${userId}/ban`,
      { reason }
    );
    return response.data;
  },

  unban: async (userId: string): Promise<BanUserResponse> => {
    const response = await apiClient.post<BanUserResponse>(
      `/admin/users/${userId}/unban`
    );
    return response.data;
  },
};

