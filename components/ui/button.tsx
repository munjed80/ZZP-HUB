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
  // Primary - Sophisticated emerald gradient with enhanced depth
  primary:
    "group relative isolate overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border border-emerald-500/40 shadow-[0_8px_32px_-12px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_48px_-16px_rgba(16,185,129,0.6)] hover:-translate-y-0.5 hover:brightness-110 transition-all duration-300 focus-visible:ring-emerald-400/80",

  // Secondary - Clean white/slate with subtle emerald accent
  secondary:
    "text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] hover:border-emerald-200/80 dark:hover:border-emerald-700/60 hover:bg-slate-50/90 dark:hover:bg-slate-750 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-12px_rgba(16,185,129,0.12)] transition-all duration-300",

  // Outline - Refined border with emerald hover accent
  outline:
    "bg-transparent text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300/60 dark:hover:border-emerald-600/60 hover:-translate-y-0.5 transition-all duration-300",

  // Destructive - Sophisticated rose gradient with depth
  destructive:
    "group relative isolate overflow-hidden bg-gradient-to-br from-rose-500 to-rose-600 text-white border border-rose-400/40 shadow-[0_8px_32px_-12px_rgba(244,63,94,0.4)] hover:shadow-[0_12px_48px_-16px_rgba(244,63,94,0.6)] hover:-translate-y-0.5 hover:brightness-110 transition-all duration-300 focus-visible:ring-rose-400",

  // Ghost - Minimal with refined hover state
  ghost:
    "text-slate-700 dark:text-slate-200 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 hover:-translate-y-0.5 transition-all duration-300",

  // Link - Clean text with emerald accent
  link:
    "text-emerald-600 dark:text-emerald-400 border-2 border-transparent hover:text-emerald-700 dark:hover:text-emerald-300 underline-offset-4 hover:underline transition-colors duration-200",
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
      {(variant === "primary" || variant === "destructive") && (
        <>
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
          <span className="absolute inset-[1px] rounded-[11px] bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.05)_50%,rgba(255,255,255,0))] opacity-60 mix-blend-overlay pointer-events-none" aria-hidden />
        </>
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
});
