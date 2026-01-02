/**
 * Centralized Style Configuration
 * 
 * This file defines all semantic colors and styles used throughout the app.
 * Use these constants instead of hardcoding color classes to ensure consistency.
 */

// ============================================================================
// SEMANTIC COLORS - Use CSS variables from index.css where possible
// ============================================================================

/**
 * Status colors for badges, indicators, and highlights
 */
export const statusColors = {
  success: {
    bg: "bg-emerald-500/10",
    bgHover: "hover:bg-emerald-500/20",
    text: "text-emerald-500",
    border: "border-emerald-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    bgHover: "hover:bg-amber-500/20",
    text: "text-amber-500",
    border: "border-amber-500",
  },
  error: {
    bg: "bg-red-500/10",
    bgHover: "hover:bg-red-500/20",
    text: "text-red-500",
    border: "border-red-500",
  },
  info: {
    bg: "bg-sky-500/10",
    bgHover: "hover:bg-sky-500/20",
    text: "text-sky-500",
    border: "border-sky-500",
  },
  neutral: {
    bg: "bg-slate-500/10",
    bgHover: "hover:bg-slate-500/20",
    text: "text-slate-500",
    border: "border-slate-500",
  },
} as const;

/**
 * Avatar gradient colors - Use consistently for entity types
 */
export const avatarColors = {
  // Users - Tech blue gradient
  user: "bg-gradient-to-br from-cyan-500 to-blue-600",
  
  // Projects - Emerald/Teal gradient  
  project: "bg-gradient-to-br from-emerald-500 to-teal-600",
  
  // Sessions/Activity - Sky/Cyan gradient
  session: "bg-gradient-to-br from-sky-500 to-cyan-600",
  
  // Conversations/Messages - Blue gradient
  conversation: "bg-gradient-to-br from-blue-500 to-sky-600",
  
  // System/Bot - Slate gradient
  system: "bg-gradient-to-br from-slate-500 to-slate-700",
  
  // Ranking - Gold/Orange gradient
  rank: {
    first: "bg-gradient-to-br from-amber-400 to-orange-500",
    second: "bg-gradient-to-br from-slate-300 to-slate-500",
    third: "bg-gradient-to-br from-amber-600 to-amber-800",
    default: "bg-muted",
  },
} as const;

/**
 * Icon container colors for StatCards and similar components
 */
export const iconContainerColors = {
  blue: {
    bg: "bg-sky-500/10",
    text: "text-sky-500",
  },
  green: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
  },
  purple: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-500",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-500",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-500",
  },
} as const;

/**
 * Conversation/Message role colors
 */
export const roleColors = {
  user: {
    bg: "bg-primary",
    text: "text-primary-foreground",
    avatar: "bg-emerald-500/20 text-emerald-500",
  },
  assistant: {
    bg: "bg-muted",
    text: "text-foreground",
    avatar: "bg-sky-500/20 text-sky-500",
  },
  system: {
    bg: "bg-amber-500/10 border border-amber-500/20",
    text: "text-foreground",
    avatar: "bg-amber-500/20 text-amber-500",
  },
} as const;

/**
 * Row highlight colors for tables with status
 */
export const rowStatusColors = {
  error: "bg-red-500/5 hover:bg-red-500/10 border-l-2 border-l-red-500",
  success: "bg-emerald-500/5 hover:bg-emerald-500/10",
  warning: "bg-amber-500/5 hover:bg-amber-500/10",
  active: "bg-sky-500/5 hover:bg-sky-500/10",
  default: "",
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export type StatusType = keyof typeof statusColors;
export type AvatarType = keyof typeof avatarColors;
export type IconColorType = keyof typeof iconContainerColors;

/**
 * Get status color classes
 */
export function getStatusClasses(status: StatusType) {
  return statusColors[status];
}

/**
 * Get avatar gradient class
 */
export function getAvatarClass(type: AvatarType) {
  return avatarColors[type];
}

/**
 * Get ranking avatar class based on position (1-indexed)
 */
export function getRankAvatarClass(position: number) {
  switch (position) {
    case 1:
      return avatarColors.rank.first;
    case 2:
      return avatarColors.rank.second;
    case 3:
      return avatarColors.rank.third;
    default:
      return avatarColors.rank.default;
  }
}

/**
 * Get icon container classes
 */
export function getIconContainerClasses(color: IconColorType) {
  return iconContainerColors[color];
}
