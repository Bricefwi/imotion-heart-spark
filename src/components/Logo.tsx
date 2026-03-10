import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo-imotion.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = false, className }: LogoProps) {
  const imgSizes = {
    sm: "h-12",
    md: "h-16",
    lg: "h-20",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={logoImg}
        alt="IMOTION — AI No-Code Solutions"
        className={cn("w-auto object-contain", imgSizes[size])}
      />
    </div>
  );
}
