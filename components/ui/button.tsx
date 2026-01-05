import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link";

const baseClasses = [
  "relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5",
  "text-sm font-semibold transition-all duration-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-[1px]",
].join(" ");

const variantClasses: Record<ButtonVariant, string> = {
primary:
    "text-[rgb(var(--brand-on-primary))] bg-[linear-gradient(120deg,rgb(var(--brand-primary)),rgb(var(--brand-primary-hover)))] border border-transparent shadow-[0_18px_48px_-28px_rgba(var(--brand-primary),0.55)] hover:shadow-[0_22px_56px_-26px_rgba(var(--brand-primary),0.65)] hover:translate-y-[-1px] active:bg-[linear-gradient(120deg,rgb(var(--brand-primary-active)),rgb(var(--brand-primary)))] active:shadow-[0_14px_40px_-28px_rgba(var(--brand-primary),0.6)]",
  
  // Secondary - Subtle brand tint
  secondary:
    "text-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary)/0.08)] border border-[rgb(var(--brand-primary)/0.5)] hover:bg-[rgb(var(--brand-primary)/0.14)] shadow-sm hover:shadow-md",
  
  // Outline - Token border
  outline:
    "bg-transparent text-[rgb(var(--brand-primary))] border border-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary)/0.1)] shadow-sm",
  
  // Destructive - Fiery
  destructive:
    "bg-destructive text-destructive-foreground border border-destructive/80 hover:bg-destructive/90 shadow-sm hover:shadow-md focus-visible:ring-destructive",
  
  // Ghost - Minimal
  ghost:
    "text-[rgb(var(--brand-primary))] border border-transparent hover:bg-[rgb(var(--brand-primary)/0.08)]",
  
  // Link - Text only
  link:
    "text-[rgb(var(--brand-primary))] border border-transparent hover:text-[rgb(var(--brand-primary-hover))] underline-offset-4 hover:underline",
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
