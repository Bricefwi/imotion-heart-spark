import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Button — Brand v2 (coral/amber/ink + signature gradients).
 *
 * Backwards compatible: all v1 variants kept (`default`, `destructive`,
 * `outline`, `secondary`, `ghost`, `link`).
 *
 * New v2 variants:
 *  - `flame`: signature CTA (gradient flame, glow shadow)
 *  - `ember`: alternative CTA (3-stop ember gradient)
 *  - `gradient-outline`: transparent fg with animated coral→amber border
 *  - `dark`: ink-900 surface for inverted CTA on light backgrounds
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-[0_4px_15px_hsl(var(--primary)/0.35)] hover:brightness-110 hover:shadow-[0_6px_20px_hsl(var(--primary)/0.45)] hover:-translate-y-[1px] active:translate-y-0",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground shadow-[0_4px_15px_hsl(var(--destructive)/0.3)] hover:brightness-110 hover:shadow-[0_6px_20px_hsl(var(--destructive)/0.4)] hover:-translate-y-[1px] active:translate-y-0",
        outline:
          "border border-input bg-background hover:bg-accent/50 hover:text-accent-foreground hover:border-accent hover:-translate-y-[1px] active:translate-y-0",
        secondary:
          "bg-muted text-foreground border border-transparent hover:border-border hover:bg-muted/80 hover:-translate-y-[1px] active:translate-y-0",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",

        // ─── Brand v2 additive variants ───────────────────────────
        flame:
          "bg-gradient-flame text-white border-0 shadow-glow hover:shadow-glow-lg hover:-translate-y-[1px] active:translate-y-0",
        ember:
          "bg-gradient-ember text-white border-0 shadow-glow hover:shadow-glow-lg hover:-translate-y-[1px] active:translate-y-0",
        "gradient-outline":
          "relative bg-background text-foreground border border-transparent bg-clip-padding hover:-translate-y-[1px] active:translate-y-0 [background-image:linear-gradient(hsl(var(--background)),hsl(var(--background))),var(--gradient-flame)] [background-origin:border-box] [background-clip:padding-box,border-box]",
        dark:
          "bg-foreground text-background hover:bg-foreground/90 hover:-translate-y-[1px] active:translate-y-0 shadow-md",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-[var(--radius-md)]",
        sm: "h-9 px-3.5 text-xs rounded-[var(--radius-md)]",
        lg: "h-11 px-8 text-base rounded-[var(--radius-md)]",
        xl: "h-13 px-10 text-base font-semibold rounded-[var(--radius-lg)]",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
