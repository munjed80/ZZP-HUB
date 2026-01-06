import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, variant = "info", className, ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    info: "bg-sky-900 text-sky-50 border border-sky-500/80 shadow-[0_10px_30px_-22px_rgba(14,165,233,0.75)]",
    success: "bg-emerald-800 text-emerald-50 border border-emerald-500/80 shadow-[0_10px_30px_-22px_rgba(16,185,129,0.75)]",
    warning: "bg-amber-700 text-amber-50 border border-amber-400/80 shadow-[0_10px_30px_-22px_rgba(245,158,11,0.65)]",
    muted: "bg-muted/80 text-foreground border border-border/80 shadow-sm",
    destructive: "bg-rose-800 text-rose-50 border border-rose-500/80 shadow-[0_10px_30px_-22px_rgba(244,63,94,0.65)]",
    primary: "bg-emerald-900 text-emerald-50 border border-emerald-500/80 shadow-[0_10px_30px_-22px_rgba(16,185,129,0.7)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 hover:scale-105 will-change-transform",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
