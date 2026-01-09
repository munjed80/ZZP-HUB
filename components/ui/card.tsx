import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
};

type CardSectionProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        // Enhanced visual design with sophisticated depth
        "rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-card p-4 sm:p-5 md:p-6",
        "shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)]",
        "transition-all duration-300 hover:border-emerald-200/60 dark:hover:border-emerald-700/40",
        // Better touch feedback
        "active:scale-[0.995] touch-manipulation",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardSectionProps) {
  return <div className={cn("flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 pb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardSectionProps) {
  return <h3 className={cn("text-base sm:text-lg font-bold text-card-foreground tracking-tight", className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardSectionProps) {
  return <div className={cn("text-sm text-muted-foreground leading-relaxed", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardSectionProps) {
  return <div className={cn("pt-3", className)}>{children}</div>;
}
