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

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not children
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  const handleCloseClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent event from bubbling to avoid triggering actions
    e.preventDefault();
    e.stopPropagation();
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={handleBackdropClick}>
      {/* Backdrop - blocks pointer events to elements behind */}
      <div
        className="absolute inset-0 bg-foreground/45 backdrop-blur-sm animate-in fade-in duration-200"
        style={{ pointerEvents: "auto" }}
        aria-hidden="true"
      />
      
      {/* Sheet - prevent click-through */}
      <div
        className="relative z-10 mb-1 w-full max-w-2xl flex flex-col rounded-t-3xl border border-emerald-100/30 bg-card/95 shadow-[0_-18px_60px_-34px_rgba(16,185,129,0.55)] backdrop-blur-md max-h-[82vh] animate-in slide-in-from-bottom duration-300"
        style={{ pointerEvents: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-border/80 px-4 py-3">
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
              onClick={handleCloseClick}
              className="rounded-xl p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-primary hover:bg-primary/10 transition-colors ring-1 ring-transparent focus-visible:ring-emerald-300/80"
              aria-label="Sluiten"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
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
