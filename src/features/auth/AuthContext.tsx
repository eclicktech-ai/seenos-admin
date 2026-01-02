import { useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "@/api/auth";
import { STORAGE_KEYS } from "@/lib/constants";
import type { User } from "@/types";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.me();
      // Transform AuthMeResponse to User type
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        isAdmin: response.isAdmin,
        isSuperAdmin: false, // TODO: add isSuperAdmin to backend response
        createdAt: response.user.created_at,
      };
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password, createSession: false });
    localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    // Login response doesn't include isAdmin, so we need to fetch full user info
    // Call /auth/me to get complete user data with admin status
    const meResponse = await authApi.me();
    const userData: User = {
      id: meResponse.user.id,
      email: meResponse.user.email,
      name: meResponse.user.name,
      isAdmin: meResponse.isAdmin,
      isSuperAdmin: false, // TODO: add isSuperAdmin to backend response
      createdAt: meResponse.user.created_at,
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Initialize auth state
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Invalid stored user
      }
    }
    refreshUser();
  }, [refreshUser]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
