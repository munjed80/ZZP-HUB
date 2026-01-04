import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const baseClasses = [
  "relative inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5",
  "text-sm font-semibold transition-colors duration-150",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-teal-600 text-white border border-teal-700 hover:bg-teal-700 shadow-sm",
  secondary:
    "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm",
  ghost: "text-slate-700 border border-transparent hover:bg-slate-100",
  destructive:
    "bg-rose-600 text-white border border-rose-700 hover:bg-rose-700 shadow-sm focus-visible:ring-rose-600",
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
