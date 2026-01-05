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
        "rounded-xl border border-[var(--border)]/80 bg-[var(--surface)] p-4 md:p-5 shadow-sm shadow-slate-200/60 dark:shadow-black/30 hover:shadow-md hover:shadow-slate-200/80 dark:hover:shadow-black/50 transition-shadow duration-200 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardSectionProps) {
  return <div className={cn("flex items-start justify-between gap-2 pb-3", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardSectionProps) {
  return <h3 className={cn("text-base font-semibold text-[var(--foreground)]", className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardSectionProps) {
  return <div className={cn("text-sm text-[var(--muted)] leading-relaxed", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardSectionProps) {
  return <div className={cn("pt-3", className)}>{children}</div>;
}
