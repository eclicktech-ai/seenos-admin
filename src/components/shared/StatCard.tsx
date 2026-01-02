import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { statusColors } from "@/lib/styles";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  color?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

// Map color prop to statusColors
const colorMapping = {
  default: {
    text: "text-primary",
    bg: "bg-primary/10",
  },
  success: {
    text: statusColors.success.text,
    bg: statusColors.success.bg,
  },
  warning: {
    text: statusColors.warning.text,
    bg: statusColors.warning.bg,
  },
  error: {
    text: statusColors.error.text,
    bg: statusColors.error.bg,
  },
  info: {
    text: statusColors.info.text,
    bg: statusColors.info.bg,
  },
} as const;

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "default",
  className,
}: StatCardProps) {
  const colors = colorMapping[color];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.value >= 0 ? statusColors.success.text : statusColors.error.text
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%{trend.label && ` ${trend.label}`}
              </p>
            )}
          </div>
          <div className={cn("rounded-full p-3", colors.bg)}>
            <Icon className={cn("h-6 w-6", colors.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
