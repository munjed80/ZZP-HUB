import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
};

export function Badge({ children, variant = "info" }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    info: "bg-[#e7eef4] text-[#0a2e50] ring-[#c7d4de]",
    success: "bg-[#e8f7f0] text-[#10b981] ring-[#bfe9d4]",
    warning: "bg-amber-100 text-amber-800 ring-amber-200",
    muted: "bg-slate-100 text-slate-700 ring-slate-200",
    destructive: "bg-red-100 text-red-800 ring-red-200",
    primary: "bg-[#d9e3ec] text-[#0a2e50] ring-[#c2d4e2]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        styles[variant]
      )}
    >
      {children}
    </span>
  );
}
