export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const STORAGE_KEYS = {
  TOKEN: "admin_token",
  USER: "admin_user",
  THEME: "admin_theme",
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
} as const;

export const USER_STATUS = {
  ACTIVE: "active",
  BANNED: "banned",
} as const;

