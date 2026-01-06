import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link";

const baseClasses = [
  // Enhanced mobile touch targets (min 44px recommended by Apple, 48px by Android)
  "relative inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5",
  // Improved typography and spacing for mobile
  "text-sm font-semibold transition-all duration-200",
  // Better focus visibility for accessibility
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  // Improved disabled state and touch feedback
  "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-[1px] active:scale-[0.98]",
  // Prevent text selection on mobile for better UX
  "select-none touch-manipulation",
].join(" ");

const variantClasses: Record<ButtonVariant, string> = {
  // Primary - Green base with amber accent glow (inspired by hero CTA)
  primary:
    "group bg-gradient-to-r from-primary to-primary/90 text-primary-foreground border-2 border-primary/90 shadow-[0_16px_36px_-18px_rgba(var(--primary),0.75)] hover:shadow-[0_20px_42px_-16px_rgba(var(--primary),0.85)] hover:scale-[1.02] overflow-hidden",

  // Secondary - Subtle surface with border
  secondary:
    "text-foreground bg-gradient-to-r from-secondary to-secondary/95 border-2 border-border shadow-md hover:shadow-lg hover:border-primary/30 hover:scale-[1.02]",

  // Outline - Neutral border with better contrast
  outline:
    "bg-transparent text-foreground border-2 border-border shadow-md hover:bg-muted hover:border-primary/30 hover:shadow-lg hover:scale-[1.02]",

  // Destructive - Fiery red with strong contrast
  destructive:
    "bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground border-2 border-destructive/80 shadow-[0_16px_36px_-18px_rgba(var(--destructive),0.75)] hover:shadow-[0_20px_42px_-16px_rgba(var(--destructive),0.85)] hover:scale-[1.02] focus-visible:ring-destructive",

  // Ghost - Minimal with stronger hover
  ghost:
    "text-foreground border-2 border-transparent hover:bg-muted hover:text-foreground hover:border-border hover:scale-[1.02]",

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
