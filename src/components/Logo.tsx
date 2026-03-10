import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "gradient-primary rounded-xl flex items-center justify-center font-display font-extrabold text-white shadow-lg",
          sizes[size]
        )}
      >
        IM
      </div>
      {showText && (
        <span className={cn("font-display font-bold tracking-tight text-foreground", textSizes[size])}>
          IMOTION
        </span>
      )}
    </div>
  );
}
