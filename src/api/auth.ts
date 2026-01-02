import apiClient from "./client";

export interface LoginRequest {
  email: string;
  password: string;
  createSession?: boolean;
}

// User info returned from API (without admin flags)
export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface AuthMeResponse {
  user: UserInfo;
  settings: Record<string, unknown>;
  isAdmin: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  inviteCode?: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/admin/login", data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/register", data);
    return response.data;
  },

  me: async (): Promise<AuthMeResponse> => {
    const response = await apiClient.get<AuthMeResponse>("/auth/me");
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};
