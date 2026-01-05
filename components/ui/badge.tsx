import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, variant = "info", className, ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    // Info - for "Verzonden" (Sent) invoice status
    info: "bg-accent/10 text-accent-foreground border-accent/20",
    
    // Success - for "Betaald" (Paid) invoice status
    success: "bg-success/10 text-success-foreground border-success/20",
    
    // Warning - for "Herinnering" (Reminder) invoice status
    warning: "bg-warning/10 text-warning-foreground border-warning/20",
    
    // Muted - for "Concept" (Draft) invoice status
    muted: "bg-muted text-muted-foreground border-border",
    
    // Destructive - for errors or critical states
    destructive: "bg-destructive/10 text-destructive-foreground border-destructive/20",
    
    // Primary - for emphasis
    primary: "bg-primary text-primary-foreground border-primary/80",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
