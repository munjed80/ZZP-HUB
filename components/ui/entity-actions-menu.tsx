"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";
import { Popover } from "./popover";
import { Sheet } from "./sheet";

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
}: EntityActionsMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const resolvedOpen = useMemo(() => (open === undefined ? internalOpen : open), [internalOpen, open]);

  // Use matchMedia for proper mobile detection without setTimeout
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Initial check
    handleChange(mediaQuery);
    
    // Listen for changes
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
    <button
      type="button"
      onClick={() => handleOpenChange(!resolvedOpen)}
      className={cn(
        buttonVariants(iconOnly ? "ghost" : "secondary"),
        iconOnly
          ? "min-h-0 h-10 w-10 rounded-full border border-border bg-card p-0 text-muted-foreground shadow-none transition hover:border-primary/30 hover:text-primary"
          : "px-3 py-2 gap-2 border border-border text-card-foreground shadow-sm",
        triggerClassName,
      )}
      aria-haspopup="menu"
      aria-expanded={resolvedOpen}
      aria-label={ariaLabel ?? label}
    >
      <MoreVertical className="h-4 w-4" aria-hidden />
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={resolvedOpen} onOpenChange={handleOpenChange} title={title ?? label} description={description}>
          <div className="space-y-3">{children}</div>
        </Sheet>
      </>
    );
  }

  return (
    <Popover
      trigger={trigger}
      align="end"
      side="bottom"
      collisionPadding={16}
      open={resolvedOpen}
      onOpenChange={handleOpenChange}
    >
      <div className="w-72 space-y-3">{children}</div>
    </Popover>
  );
}
