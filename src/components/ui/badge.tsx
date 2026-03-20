import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
        secondary:
          "border-transparent bg-secondary/10 text-secondary hover:bg-secondary/15",
        destructive:
          "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/15",
        success:
          "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15",
        warning:
          "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15",
        info:
          "border-transparent bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15",
        outline:
          "text-foreground border-border/60",
        muted:
          "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
