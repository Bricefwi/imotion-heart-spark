import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo-imotion-trimmed.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = false, className }: LogoProps) {
  const imgSizes = {
    sm: "h-12",
    md: "h-20",
    lg: "h-28",
    xl: "h-36",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={logoImg}
        alt="IMOTION — AI No-Code Solutions"
        className={cn("block w-auto max-h-full shrink-0 object-contain", imgSizes[size])}
      />
    </div>
  );
}
