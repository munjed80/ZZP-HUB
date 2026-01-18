"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MoreVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

const SWIPE_CLOSE_THRESHOLD = 75;

/**
 * Props for individual action items in the ActionSheet
 */
export type ActionItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
};

/**
 * Props for the ActionSheet component
 */
type ActionSheetProps = {
  /** Array of action items to display */
  actions: ActionItem[];
  /** Label for the trigger button */
  label?: string;
  /** Title displayed in the action sheet header */
  title?: string;
  /** Description/subtitle displayed under the title */
  description?: string;
  /** Additional classes for the trigger button */
  triggerClassName?: string;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether to show only icon for the trigger button */
  iconOnly?: boolean;
  /** Aria label for the trigger button */
  ariaLabel?: string;
  /** Label for the close button */
  closeLabel?: string;
};

/**
 * ActionSheet component - A responsive action menu that displays as a bottom sheet on mobile
 * and a contextual dropdown on desktop.
 * 
 * Features:
 * - Mobile (<768px): Full-width bottom sheet with rounded corners, swipe-to-close
 * - Desktop (>=768px): Contextual dropdown near trigger button
 * - WCAG-compliant contrast ratios
 * - Keyboard accessible (Tab, Enter, Escape)
 * - Focus trap when open
 * - Prevents background scroll
 * - Dark backdrop with smooth animations
 */
export function ActionSheet({
  actions,
  label = "Acties",
  title,
  description,
  triggerClassName,
  open,
  onOpenChange,
  iconOnly = false,
  ariaLabel,
  closeLabel = "Sluiten",
}: ActionSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const swipeStartY = useRef<number | null>(null);

  const resolvedOpen = useMemo(() => (open === undefined ? internalOpen : open), [internalOpen, open]);

  // Detect mobile viewport
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    if (resolvedOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [resolvedOpen]);

  const handleOpenChange = (next: boolean) => {
    if (open === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const trigger = (
    <Dialog.Trigger asChild>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className={cn(
          buttonVariants(iconOnly ? "ghost" : "secondary"),
          iconOnly
            ? "min-h-[44px] h-11 w-11 rounded-full border border-border bg-card p-0 text-muted-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-md focus-visible:border-primary/60 focus-visible:bg-primary/10"
            : "min-h-[44px] px-4 py-2.5 gap-2 border border-border text-card-foreground shadow-sm hover:shadow-md hover:border-border/80",
          triggerClassName,
        )}
        aria-haspopup="dialog"
        aria-expanded={resolvedOpen}
        aria-label={ariaLabel ?? label}
      >
        <MoreVertical className="h-5 w-5" aria-hidden />
        {iconOnly ? <span className="sr-only">{label}</span> : label}
      </button>
    </Dialog.Trigger>
  );

  // Swipe-to-close handlers for mobile
  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const firstTouch = event.touches[0];
    swipeStartY.current = firstTouch ? firstTouch.clientY : null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (swipeStartY.current === null) return;
    const currentY = event.touches[0]?.clientY;
    if (currentY === undefined) return;
    const delta = currentY - swipeStartY.current;
    if (delta > SWIPE_CLOSE_THRESHOLD) {
      handleOpenChange(false);
      swipeStartY.current = null;
    }
  };

  // Improved backdrop with better contrast
  const overlayClasses =
    "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200";

  // Mobile bottom sheet - full width, centered, with safe area padding
  const mobileContentClasses =
    "fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85vh] w-full max-w-[560px] rounded-t-[24px] border-t border-x border-border bg-card shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.3)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full duration-300 ease-out pb-[env(safe-area-inset-bottom)]";

  // Desktop dropdown - positioned near trigger
  const desktopContentClasses =
    "fixed right-8 bottom-20 z-50 w-[360px] max-w-[calc(100vw-4rem)] rounded-2xl border border-border bg-card shadow-[0_16px_48px_-12px_rgba(0,0,0,0.25)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out-0 duration-200";

  const contentClasses = cn(
    "overflow-hidden focus:outline-none",
    isMobile ? mobileContentClasses : desktopContentClasses,
  );

  return (
    <Dialog.Root open={resolvedOpen} onOpenChange={handleOpenChange}>
      {trigger}
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClasses} />
        <Dialog.Content
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? () => (swipeStartY.current = null) : undefined}
          className={contentClasses}
        >
          {/* Header */}
          <div className={cn("px-5 border-b border-border bg-muted/30", isMobile ? "pt-4 pb-4" : "pt-5 pb-4")}>
            {/* Swipe indicator for mobile */}
            {isMobile && (
              <div className="flex justify-center mb-3">
                <div className="h-1 w-12 rounded-full bg-muted-foreground/30" aria-hidden />
              </div>
            )}
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {title && (
                  <Dialog.Title className="text-lg font-semibold text-foreground leading-tight">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="text-sm text-muted-foreground mt-1 truncate">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              
              {/* Close button */}
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:border-border/80 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={closeLabel}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Actions list */}
          <div className={cn("overflow-y-auto", isMobile ? "px-4 py-3" : "px-3 py-3")}>
            <div className="space-y-1">
              {actions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    action.onClick();
                    handleOpenChange(false);
                  }}
                  disabled={action.disabled}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3.5 text-left text-sm font-medium transition-all min-h-[48px]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    action.variant === "danger"
                      ? "text-destructive hover:bg-destructive/10 hover:text-destructive active:bg-destructive/20"
                      : "text-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
                  )}
                >
                  {action.icon && (
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5" aria-hidden>
                      {action.icon}
                    </span>
                  )}
                  <span className="flex-1">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
