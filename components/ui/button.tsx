import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link";

const baseClasses = [
  // Enhanced mobile touch targets (min 44px recommended by Apple, 48px by Android)
  "relative inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5",
  // Improved typography and spacing for mobile
  "text-sm font-semibold transition-all duration-200 leading-tight",
  // Better focus visibility for accessibility
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  // Improved disabled state and touch feedback
  "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-[1px] active:scale-[0.98]",
  // Prevent text selection on mobile for better UX
  "select-none touch-manipulation",
].join(" ");

const variantClasses: Record<ButtonVariant, string> = {
  // Primary - Deep emerald gradient for premium contrast
  primary:
    "group relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white border border-emerald-600/70 shadow-[0_14px_36px_-20px_rgba(16,185,129,0.85)] hover:shadow-[0_20px_44px_-18px_rgba(16,185,129,0.95)] hover:-translate-y-[1px] focus-visible:ring-emerald-300/80",

  // Secondary - Tinted surface with emerald accent for clarity
  secondary:
    "text-emerald-950 dark:text-emerald-50 bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 shadow-[0_10px_30px_-24px_rgba(16,185,129,0.45)] hover:border-emerald-200 hover:bg-emerald-50/90 hover:-translate-y-[0.5px] dark:from-slate-800 dark:to-slate-900 dark:border-emerald-900/60 dark:hover:border-emerald-700/60",

  // Outline - Neutral with emerald hover for alignment to HERO palette
  outline:
    "bg-transparent text-foreground border border-emerald-200 dark:border-slate-700 shadow-sm hover:bg-emerald-50/70 hover:text-emerald-900 hover:border-emerald-300 hover:-translate-y-[0.5px] dark:hover:bg-slate-800/70 dark:hover:text-emerald-50",

  // Destructive - Deep crimson gradient with strong focus state
  destructive:
    "bg-gradient-to-br from-rose-600 via-rose-600 to-rose-700 text-destructive-foreground border border-rose-500/80 shadow-[0_14px_32px_-18px_rgba(244,63,94,0.9)] hover:shadow-[0_18px_40px_-18px_rgba(244,63,94,0.95)] hover:-translate-y-[1px] focus-visible:ring-destructive",

  // Ghost - Minimal with emerald hover accent
  ghost:
    "text-foreground border border-transparent hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-900 hover:-translate-y-[0.5px] dark:hover:bg-slate-800/70 dark:hover:text-emerald-50",

  // Link - Text only with primary color
  link:
    "text-primary border-2 border-transparent hover:text-primary/80 underline-offset-4 hover:underline",
};

export function buttonVariants(variant: ButtonVariant = "primary", className?: string) {
  return cn(baseClasses, variantClasses[variant], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", children, ...props },
  ref,
) {
  return (
    <button ref={ref} className={buttonVariants(variant, className)} {...props}>
      {variant === "primary" && (
        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
});
