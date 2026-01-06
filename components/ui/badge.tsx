import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, variant = "info", className, ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    // Info - for "Verzonden" (Sent) invoice status
    info: "bg-accent/12 text-accent border border-accent/30",
    
    // Success - for "Betaald" (Paid) invoice status
    success: "bg-success/12 text-success border border-success/25",
    
    // Warning - for "Herinnering" (Reminder) invoice status
    warning: "bg-warning/12 text-warning-foreground border-warning/25",
    
    // Muted - for "Concept" (Draft) invoice status
    muted: "bg-muted text-muted-foreground border-border",
    
    // Destructive - for errors or critical states
    destructive: "bg-destructive/10 text-destructive-foreground border-destructive/20",
    
    // Primary - for emphasis
    primary: "bg-primary/10 text-primary border-primary/40",
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
