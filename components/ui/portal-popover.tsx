"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type PortalPopoverProps = {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentClassName?: string;
};

export function PortalPopover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  contentClassName,
}: PortalPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [mounted, setMounted] = useState(false);

  // Track mounted state for portal - using queueMicrotask to avoid sync setState in effect
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
    return () => {
      setMounted(false);
    };
  }, []);

  // Calculate position based on trigger element
  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentHeight = contentRef.current?.offsetHeight || 300; // estimate if not yet rendered
      const contentWidth = contentRef.current?.offsetWidth || 240;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const padding = 8;

      // Calculate vertical position
      let top = triggerRect.bottom + 8; // default: below trigger
      let openUpward = false;

      // Check if there's enough space below
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      if (spaceBelow < contentHeight + padding && spaceAbove > spaceBelow) {
        // Open upward if not enough space below and more space above
        top = triggerRect.top - contentHeight - 8;
        openUpward = true;
      }

      // Clamp top to viewport
      top = Math.max(padding, Math.min(top, viewportHeight - contentHeight - padding));

      // Calculate horizontal position (align to right of trigger)
      let left = triggerRect.right - contentWidth;

      // Clamp left to viewport
      left = Math.max(padding, Math.min(left, viewportWidth - contentWidth - padding));

      setPosition({ top, left, openUpward });
    };

    // Initial calculation
    updatePosition();

    // Update on scroll or resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  // Handle click outside to close
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        contentRef.current &&
        !contentRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    // Use capture phase and small delay to handle clicks properly
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 0);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [open, setOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, setOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };

  const handleContentClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent closing when clicking inside
    e.stopPropagation();
  };

  const portalContent = open && mounted ? (
    <>
      {/* Backdrop - invisible click catcher */}
      <div
        className="fixed inset-0 z-[70]"
        style={{ background: "transparent", pointerEvents: "auto" }}
        aria-hidden="true"
      />
      {/* Popover content */}
      <div
        ref={contentRef}
        onClick={handleContentClick}
        className={cn(
          "fixed z-[80] min-w-[200px] rounded-xl animate-in fade-in-0 zoom-in-95",
          position.openUpward ? "slide-in-from-bottom-2" : "slide-in-from-top-2",
          contentClassName
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          pointerEvents: "auto",
        }}
      >
        {children}
      </div>
    </>
  ) : null;

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick} className="inline-block cursor-pointer">
        {trigger}
      </div>
      {mounted && typeof window !== "undefined" && createPortal(portalContent, document.body)}
    </>
  );
}
