"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  description?: string;
};

export function Sheet({ open, onOpenChange, children, title, description }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col bg-card rounded-t-2xl shadow-xl max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-border px-4 py-4">
            <div className="flex-1">
              {title && (
                <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-2 text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary)/0.08)] transition-colors"
              aria-label="Sluiten"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

type SheetTriggerProps = {
  children: ReactNode;
  onClick: () => void;
  className?: string;
};

export function SheetTrigger({ children, onClick, className }: SheetTriggerProps) {
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
