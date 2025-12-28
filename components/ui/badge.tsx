import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning";
};

export function Badge({ children, variant = "info" }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    info: "bg-sky-100 text-sky-700 ring-sky-200",
    success: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-100 text-amber-800 ring-amber-200",
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
