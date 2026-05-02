import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — Brand v2.
 * - Warm neutral border (ink-200) inherited via `--border` token.
 * - Coral focus ring via `--ring`.
 * - Slightly larger radius for premium feel; same external API as v1.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius-md)] border border-input bg-background px-3.5 py-2 text-base text-foreground ring-offset-background transition-all duration-200 ease-smooth",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/60",
          "hover:border-foreground/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 focus-visible:border-primary/60",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/30",
          "md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
