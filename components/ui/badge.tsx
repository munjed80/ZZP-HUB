import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, variant = "info", className, ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    // Info - for "Verzonden" (Sent) invoice status - amber/orange accent
    info: "bg-accent/15 text-accent-foreground border border-accent/35",
    
    // Success - for "Betaald" (Paid) invoice status
    success: "bg-success/15 text-success-foreground border border-success/30",
    
    // Warning - for "Herinnering" (Reminder) invoice status
    warning: "bg-warning/15 text-warning-foreground border border-warning/30",
    
    // Muted - for "Concept" (Draft) invoice status
    muted: "bg-muted text-muted-foreground border border-border",
    
    // Destructive - for errors or critical states
    destructive: "bg-destructive/12 text-destructive-foreground border border-destructive/25",
    
    // Primary - for emphasis
    primary: "bg-primary/12 text-primary border border-primary/35",
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
