import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "muted" | "destructive" | "primary";
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, variant = "info", className, ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    // Info - for "Verzonden" (Sent) invoice status - amber/orange accent
    info: "bg-gradient-to-r from-accent/20 to-accent/10 text-accent border-2 border-accent/40 shadow-lg shadow-accent/10",
    
    // Success - for "Betaald" (Paid) invoice status
    success: "bg-gradient-to-r from-success/20 to-success/10 text-success-foreground border-2 border-success/40 shadow-lg shadow-success/10",
    
    // Warning - for "Herinnering" (Reminder) invoice status
    warning: "bg-gradient-to-r from-warning/20 to-warning/10 text-warning-foreground border-2 border-warning/40 shadow-lg shadow-warning/10",
    
    // Muted - for "Concept" (Draft) invoice status
    muted: "bg-muted text-muted-foreground border-2 border-border shadow-md",
    
    // Destructive - for errors or critical states
    destructive: "bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive-foreground border-2 border-destructive/40 shadow-lg shadow-destructive/10",
    
    // Primary - for emphasis
    primary: "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-2 border-primary/40 shadow-lg shadow-primary/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 hover:scale-105",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
