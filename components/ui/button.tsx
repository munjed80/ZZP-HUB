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
  // Primary - Green base with amber accent glow (inspired by hero CTA)
  primary:
    "group bg-primary text-primary-foreground border border-primary/90 shadow-[0_14px_32px_-18px_rgba(var(--primary),0.65)] hover:bg-primary/90 hover:shadow-[0_16px_36px_-16px_rgba(var(--primary),0.7)] overflow-hidden",

  // Secondary - Subtle surface with border
  secondary:
    "text-foreground bg-secondary border border-border shadow-sm hover:bg-secondary/90 hover:text-foreground",

  // Outline - Neutral border with better contrast
  outline:
    "bg-transparent text-foreground border border-border shadow-sm hover:bg-muted hover:border-muted-foreground/20",

  // Destructive - Fiery red with strong contrast
  destructive:
    "bg-destructive text-destructive-foreground border border-destructive/80 hover:bg-destructive/90 shadow-sm hover:shadow-md focus-visible:ring-destructive",

  // Ghost - Minimal with stronger hover
  ghost:
    "text-foreground border border-transparent hover:bg-muted hover:text-foreground",

  // Link - Text only with primary color
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
  { className, variant = "primary", children, ...props },
  ref,
) {
  return (
    <button ref={ref} className={buttonVariants(variant, className)} {...props}>
      {variant === "primary" && (
        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/0 via-accent/12 to-accent/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
});
