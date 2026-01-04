import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const baseClasses = [
  "relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5",
  "text-sm font-semibold transition-all duration-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-[1px]",
].join(" ");

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-teal-600 to-cyan-500 text-white border border-transparent hover:from-teal-700 hover:to-cyan-600 shadow-lg shadow-teal-200/60 hover:shadow-xl",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:border-teal-200/80 hover:bg-teal-50/60 shadow-sm hover:shadow-md",
  ghost: "text-slate-700 border border-transparent hover:bg-slate-100 hover:text-slate-900",
  destructive:
    "bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 hover:border-rose-700 shadow-sm hover:shadow-md focus-visible:ring-rose-600",
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
