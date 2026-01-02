import * as React from "react";
import { CheckCircle, XCircle, Clock, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusColors, rowStatusColors, type StatusType } from "@/lib/styles";

interface StatusIndicatorProps {
  status: "success" | "error" | "warning" | "info" | "neutral" | "active" | "completed" | "pending";
  showIcon?: boolean;
  className?: string;
}

const statusMapping: Record<StatusIndicatorProps["status"], StatusType> = {
  success: "success",
  completed: "success",
  error: "error",
  warning: "warning",
  pending: "warning",
  active: "warning",
  info: "info",
  neutral: "neutral",
};

const statusIcons: Record<StatusIndicatorProps["status"], React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  warning: <AlertCircle className="h-4 w-4" />,
  pending: <Clock className="h-4 w-4" />,
  active: <Clock className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  neutral: null,
};

/**
 * Consistent status indicator icon
 */
export function StatusIcon({ 
  status, 
  className 
}: { 
  status: StatusIndicatorProps["status"]; 
  className?: string;
}) {
  const mappedStatus = statusMapping[status];
  const colors = statusColors[mappedStatus];
  
  return (
    <span className={cn(colors.text, className)}>
      {statusIcons[status]}
    </span>
  );
}

/**
 * Get row highlight class based on status
 */
export function getRowStatusClass(status: string): string {
  switch (status) {
    case "error":
      return rowStatusColors.error;
    case "completed":
    case "success":
      return rowStatusColors.success;
    case "active":
    case "warning":
    case "pending":
      return rowStatusColors.warning;
    default:
      return rowStatusColors.default;
  }
}

/**
 * Status dot indicator
 */
export function StatusDot({ 
  status, 
  className 
}: { 
  status: StatusIndicatorProps["status"]; 
  className?: string;
}) {
  const mappedStatus = statusMapping[status];
  const colors = statusColors[mappedStatus];
  
  return (
    <span 
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        colors.bg.replace("/10", ""),
        className
      )} 
    />
  );
}

