import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, variant = "info", className, ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    info: "bg-[#e8f0fa] dark:bg-blue-950/50 text-[#1d4b73] dark:text-blue-300 border-[#d4e3f3] dark:border-blue-900",
    success: "bg-[#e7f6f0] dark:bg-green-950/50 text-[#0f5132] dark:text-green-300 border-[#cce9dc] dark:border-green-900",
    warning: "bg-[#fff4e5] dark:bg-amber-950/50 text-[#8b5b0b] dark:text-amber-300 border-[#ffe2b8] dark:border-amber-900",
    muted: "bg-[#f3f6f8] dark:bg-slate-800/50 text-[#4a6076] dark:text-slate-400 border-[#e0e8ed] dark:border-slate-700",
    destructive: "bg-[#fdecee] dark:bg-red-950/50 text-[#7b1c1f] dark:text-red-300 border-[#f7c7ce] dark:border-red-900",
    primary: "bg-[#0f4c5c] dark:bg-teal-600 text-white border-[#0b3a46] dark:border-teal-700",
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
