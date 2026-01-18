"use client";

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MoreVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

const SWIPE_CLOSE_THRESHOLD = 75;

type EntityActionsMenuProps = {
  children: React.ReactNode;
  label?: string;
  title?: string;
  description?: string;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  iconOnly?: boolean;
  ariaLabel?: string;
  closeLabel?: string;
};

export function EntityActionsMenu({
  children,
  label = "Acties",
  title,
  description,
  triggerClassName,
  open,
  onOpenChange,
  iconOnly = false,
  ariaLabel,
  closeLabel,
}: EntityActionsMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const swipeStartY = useRef<number | null>(null);
  const closeText = closeLabel ?? "Sluiten";

  const resolvedOpen = useMemo(() => (open === undefined ? internalOpen : open), [internalOpen, open]);

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
            ? "min-h-0 h-10 w-10 rounded-full border border-border bg-card p-0 text-muted-foreground shadow-none transition hover:border-primary/30 hover:text-primary"
            : "px-3 py-2 gap-2 border border-border text-card-foreground shadow-sm",
          triggerClassName,
        )}
        aria-haspopup="dialog"
        aria-expanded={resolvedOpen}
        aria-label={ariaLabel ?? label}
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
        {iconOnly ? <span className="sr-only">{label}</span> : label}
      </button>
    </Dialog.Trigger>
  );

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

  const overlayClasses =
    "fixed inset-0 z-40 bg-black/50 dark:bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out";
  const mobileContentBase =
    "fixed inset-x-2 bottom-3 z-50 mx-auto max-h-[65vh] w-[clamp(320px,94vw,520px)] rounded-t-3xl border border-border bg-card backdrop-blur-2xl shadow-xl data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom";
  const desktopContentBase =
    "fixed right-8 bottom-8 z-50 w-[420px] max-w-[92vw] rounded-3xl border border-border bg-card backdrop-blur-2xl shadow-xl data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom";
  const contentClasses = cn(
    "pointer-events-auto text-card-foreground shadow-2xl focus:outline-none ring-1 ring-border data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out",
    isMobile ? mobileContentBase : desktopContentBase,
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
          <div className={cn("px-4", isMobile ? "pt-3 pb-2" : "pt-4 pb-3")}>
            {isMobile ? <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" /> : null}
            {(title || description) && (
              <div className="flex items-start justify-between gap-3">
                 <div className="space-y-1">
                   {title && <Dialog.Title className="text-lg font-semibold leading-tight text-foreground">{title}</Dialog.Title>}
                   {description && <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description>}
                 </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={closeText}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </Dialog.Close>
              </div>
            )}
          </div>
          <div className={cn("overflow-y-auto", isMobile ? "px-4 pb-4" : "px-5 pb-5 pt-1")}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
