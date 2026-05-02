import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Card — Brand v2.
 *
 * Backwards compatible: default variant matches v1 visual exactly when no
 * `variant` prop is passed. New variants are additive:
 *  - `elevated`: stronger shadow + warm gradient surface
 *  - `interactive`: clickable feel (cursor + lift on hover)
 *  - `gradient`: signature flame border (use for "Populaire" pricing)
 *  - `flat`: zero shadow, clean docs/dashboard
 *  - `dark`: ink-900 surface (use inside light pages for contrast)
 */
const cardVariants = cva(
  "rounded-[var(--radius-lg)] border bg-card text-card-foreground transition-all duration-250 ease-smooth",
  {
    variants: {
      variant: {
        default:
          "border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/10",
        elevated:
          "border-border/40 shadow-lg bg-gradient-to-b from-card to-muted/40 hover:shadow-xl hover:-translate-y-0.5",
        interactive:
          "border-border/50 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/30",
        gradient:
          "border-transparent shadow-glow [background-image:linear-gradient(hsl(var(--card)),hsl(var(--card))),var(--gradient-flame)] [background-origin:border-box] [background-clip:padding-box,border-box] hover:shadow-glow-lg hover:-translate-y-0.5",
        flat: "border-border/40 shadow-none",
        dark: "border-foreground/10 bg-foreground text-background shadow-xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground/80", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
