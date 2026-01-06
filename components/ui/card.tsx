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
        // Enhanced mobile-friendly spacing and visual design
        "rounded-2xl border-2 border-border bg-card p-3 sm:p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/20",
        // Better touch feedback on mobile
        "active:scale-[0.99] touch-manipulation",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardSectionProps) {
  return <div className={cn("flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3 pb-3", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardSectionProps) {
  return <h3 className={cn("text-base font-bold text-card-foreground", className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardSectionProps) {
  return <div className={cn("text-sm text-muted-foreground leading-relaxed", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardSectionProps) {
  return <div className={cn("pt-3", className)}>{children}</div>;
}
