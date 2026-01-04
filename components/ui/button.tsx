import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const baseClasses = [
  "relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5",
  "text-sm font-semibold tracking-tight transition-all duration-200 ease-out",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/70 focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]",
  "shadow-[0_10px_30px_-18px_rgba(13,148,136,0.45)]",
].join(" ");

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-teal-600 via-teal-600 to-teal-700 text-white ring-1 ring-teal-700/80 hover:from-teal-700 hover:to-teal-700 hover:shadow-[0_18px_45px_-24px_rgba(13,148,136,0.65)]",
  secondary:
    "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:shadow-[0_12px_35px_-24px_rgba(15,23,42,0.35)]",
  ghost: "text-slate-700 ring-1 ring-transparent hover:bg-slate-100 hover:ring-slate-200",
  destructive:
    "bg-gradient-to-r from-rose-600 to-rose-500 text-white ring-1 ring-rose-500/60 hover:from-rose-500 hover:to-rose-500 hover:shadow-[0_18px_45px_-24px_rgba(190,24,93,0.55)] focus-visible:ring-rose-500/70",
};

export function buttonVariants(variant: ButtonVariant = "primary", className?: string) {
  return cn(baseClasses, variantClasses[variant], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...props },
  ref,
) {
  return <button ref={ref} className={buttonVariants(variant, className)} {...props} />;
});
