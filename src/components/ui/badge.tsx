import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:
          "border border-border text-muted-foreground hover:bg-muted/40",
        success:
          "border-transparent bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.22)]",
        warning:
          "border-transparent bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.22)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
