import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, variant = "info", className, ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    info: "bg-[#e8f0fa] text-[#1d4b73] border-[#d4e3f3]",
    success: "bg-[#e7f6f0] text-[#0f5132] border-[#cce9dc]",
    warning: "bg-[#fff4e5] text-[#8b5b0b] border-[#ffe2b8]",
    muted: "bg-[#f3f6f8] text-[#4a6076] border-[#e0e8ed]",
    destructive: "bg-[#fdecee] text-[#7b1c1f] border-[#f7c7ce]",
    primary: "bg-[#0f4c5c] text-white border-[#0b3a46]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
