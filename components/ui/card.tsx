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
        "rounded-xl border border-[#d5dae0] bg-white p-4 md:p-5 shadow-[0_14px_46px_-28px_rgba(10,46,80,0.26)]",
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
  return <h3 className={cn("text-base font-semibold text-slate-900", className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardSectionProps) {
  return <div className={cn("text-sm text-slate-700", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardSectionProps) {
  return <div className={cn("pt-3", className)}>{children}</div>;
}
