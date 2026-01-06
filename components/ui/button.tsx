import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link";

const baseClasses = [
  "relative inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5",
  "text-sm font-semibold transition-all duration-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-[1px]",
].join(" ");

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground border border-primary/90 shadow-[0_14px_32px_-18px_rgba(var(--primary),0.65)] hover:bg-primary/90 hover:shadow-[0_16px_36px_-16px_rgba(var(--primary),0.7)]",

  // Secondary - Subtle surface with border
  secondary:
    "text-foreground bg-secondary border border-border shadow-sm hover:bg-secondary/90 hover:text-foreground",

  // Outline - Neutral border
  outline:
    "bg-transparent text-foreground border border-border shadow-sm hover:bg-muted",

  // Destructive - Fiery
  destructive:
    "bg-destructive text-destructive-foreground border border-destructive/80 hover:bg-destructive/90 shadow-sm hover:shadow-md focus-visible:ring-destructive",

  // Ghost - Minimal
  ghost:
    "text-foreground border border-transparent hover:bg-muted",

  // Link - Text only
  link:
    "text-primary border border-transparent hover:text-primary/80 underline-offset-4 hover:underline",
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
