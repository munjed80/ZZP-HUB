import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const baseClasses =
  "group relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-[1.5px] hover:scale-[1.01] shadow-[0_14px_34px_-18px_rgba(30,41,59,0.32)] hover:shadow-[0_18px_42px_-18px_rgba(51,65,85,0.36)] before:pointer-events-none before:absolute before:inset-[1.5px] before:rounded-[inherit] before:bg-white/18 before:opacity-0 before:blur-[6px] before:transition before:duration-300 hover:before:opacity-90 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-white/25 after:opacity-0 after:blur-xl after:transition-opacity after:duration-300 hover:after:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#1e293b,#334155,#1f2937)] text-white ring-1 ring-[#1e293b]/70 hover:bg-[linear-gradient(135deg,#0f172a,#1e293b,#0b1727)] hover:text-white focus-visible:ring-[#0f172a]",
  secondary:
    "bg-white text-[#1e293b] ring-1 ring-[#334155]/60 hover:bg-[#e2e8f0] hover:text-[#0f172a] focus-visible:ring-[#0f172a] focus-visible:text-[#0f172a]",
  ghost: "text-[#1e293b] hover:bg-[#e2e8f0]/70 focus-visible:ring-[#334155]",
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
