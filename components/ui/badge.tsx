import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
};

export function Badge({ children, variant = "info" }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    info: "bg-blue-100 text-blue-800 ring-blue-200",
    success: "bg-green-100 text-green-800 ring-green-200",
    warning: "bg-amber-100 text-amber-800 ring-amber-200",
    muted: "bg-slate-100 text-slate-700 ring-slate-200",
    destructive: "bg-red-100 text-red-800 ring-red-200",
    primary: "bg-indigo-100 text-indigo-800 ring-indigo-200",
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
