import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const baseClasses =
  "group relative inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-[1.5px] hover:scale-[1.01] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-white/25 after:opacity-0 after:blur-xl after:transition-opacity after:duration-300 hover:after:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500",
  secondary: "bg-white text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 focus-visible:ring-indigo-400",
  ghost: "text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-300",
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
