import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
};

export function Badge({ children, variant = "info" }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    info: "bg-slate-100 text-slate-800 ring-slate-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    muted: "bg-slate-50 text-slate-600 ring-slate-200",
    destructive: "bg-rose-50 text-rose-700 ring-rose-200",
    primary: "bg-teal-600 text-white ring-teal-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold leading-tight ring-1 ring-inset shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
        styles[variant],
      )}
    >
      {children}
    </span>
  );
}
