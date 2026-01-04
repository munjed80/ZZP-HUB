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
    "bg-gradient-to-r from-[#0f4c5c] via-[#1b6b7a] to-[#2f9e7c] text-white border border-transparent hover:from-[#0c3d4b] hover:to-[#2a8b70] shadow-lg shadow-teal-200/50 hover:shadow-xl",
  secondary:
    "bg-white/90 text-[#0f2f3a] border border-[var(--border)] hover:border-[#2f9e7c]/40 hover:bg-[#eaf4f1] shadow-sm hover:shadow-md",
  ghost: "text-[var(--muted)] border border-transparent hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]",
  destructive:
    "bg-[#e77975] text-white border border-[#d86461] hover:bg-[#d86461] hover:border-[#c55451] shadow-sm hover:shadow-md focus-visible:ring-[#d86461]",
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
