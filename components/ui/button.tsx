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
  // Primary - Mauve gradient subtle premium
  primary:
    "bg-gradient-to-r from-primary via-accent to-primary/90 text-primary-foreground border border-transparent hover:opacity-90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
  
  // Secondary - Neutral surface
  secondary:
    "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 shadow-sm hover:shadow-md",
  
  // Outline - Token border
  outline:
    "bg-transparent text-foreground border border-border hover:bg-accent hover:text-accent-foreground shadow-sm",
  
  // Destructive - Fiery
  destructive:
    "bg-destructive text-destructive-foreground border border-destructive/80 hover:bg-destructive/90 shadow-sm hover:shadow-md focus-visible:ring-destructive",
  
  // Ghost - Minimal
  ghost:
    "text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground",
  
  // Link - Text only
  link:
    "text-link border border-transparent hover:text-link-hover underline-offset-4 hover:underline",
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
