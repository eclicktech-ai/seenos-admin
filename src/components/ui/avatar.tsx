import * as React from "react";
import { cn } from "@/lib/utils";
import { avatarColors, getRankAvatarClass } from "@/lib/styles";

type AvatarVariant = "user" | "project" | "session" | "conversation" | "system";
type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-2xl",
};

const shapeClasses = {
  circle: "rounded-full",
  rounded: "rounded-lg",
};

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The text to display (usually initials) */
  children: React.ReactNode;
  /** The type of entity - determines the gradient color */
  variant?: AvatarVariant;
  /** Size of the avatar */
  size?: AvatarSize;
  /** Shape of the avatar */
  shape?: "circle" | "rounded";
  /** For ranking badges (1, 2, 3, or higher) */
  rank?: number;
}

/**
 * Consistent Avatar component with entity-based gradient colors
 * 
 * @example
 * // User avatar
 * <Avatar variant="user" size="md">{email[0].toUpperCase()}</Avatar>
 * 
 * // Project avatar
 * <Avatar variant="project" shape="rounded" size="lg">P</Avatar>
 * 
 * // Ranking badge
 * <Avatar rank={1} size="sm">{1}</Avatar>
 */
export function Avatar({
  children,
  variant = "user",
  size = "md",
  shape = "circle",
  rank,
  className,
  ...props
}: AvatarProps) {
  const gradientClass = rank !== undefined 
    ? getRankAvatarClass(rank)
    : avatarColors[variant];

  return (
    <div
      className={cn(
        "flex items-center justify-center font-semibold text-white shrink-0",
        sizeClasses[size],
        shapeClasses[shape],
        gradientClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface RoleAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  role: "user" | "assistant" | "system";
  children: React.ReactNode;
  size?: AvatarSize;
}

const roleAvatarClasses = {
  user: "bg-emerald-500/20 text-emerald-500",
  assistant: "bg-sky-500/20 text-sky-500",
  system: "bg-amber-500/20 text-amber-500",
};

/**
 * Avatar for message roles (user, assistant, system)
 */
export function RoleAvatar({ 
  role, 
  children, 
  size = "sm",
  className,
  ...props 
}: RoleAvatarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full shrink-0",
        sizeClasses[size],
        roleAvatarClasses[role],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
