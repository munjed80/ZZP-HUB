import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, variant = "info", className, ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    info: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    muted: "bg-slate-50 text-slate-600 border-slate-200",
    destructive: "bg-rose-50 text-rose-700 border-rose-200",
    primary: "bg-teal-600 text-white border-teal-700",
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
