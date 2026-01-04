import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const baseClasses =
  "group relative inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-[1.5px] hover:scale-[1.01] shadow-[0_14px_34px_-18px_rgba(10,46,80,0.32)] hover:shadow-[0_18px_42px_-18px_rgba(27,73,101,0.4)] before:pointer-events-none before:absolute before:inset-[1.5px] before:rounded-[inherit] before:bg-white/18 before:opacity-0 before:blur-[6px] before:transition before:duration-300 hover:before:opacity-90 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-white/25 after:opacity-0 after:blur-xl after:transition-opacity after:duration-300 hover:after:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#ffffff,#e7eaee,#cfd5dd)] text-[#0a2e50] ring-1 ring-[#d5dae0] hover:bg-[linear-gradient(135deg,#f8fafc,#dde2e8,#c4ccd6)] focus-visible:ring-[#1b4965]",
  secondary:
    "bg-white text-[#1b4965] ring-1 ring-[#c7d4de] hover:bg-[#eef2f5] focus-visible:ring-[#1b4965] focus-visible:text-[#0a2e50]",
  ghost: "text-slate-700 hover:bg-slate-100 focus-visible:ring-[#c7d4de]",
  destructive: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500",
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
