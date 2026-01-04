"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PopoverProps = {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end" | "center";
  side?: "top" | "bottom" | "left" | "right";
  collisionPadding?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Popover({
  trigger,
  children,
  align = "end",
  side = "bottom",
  collisionPadding = 8,
  open: controlledOpen,
  onOpenChange,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  const popoverRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  // Handle collision detection and positioning
  useEffect(() => {
    if (!open || !contentRef.current) return;
    
    const updatePosition = () => {
      if (!contentRef.current) return;
      
      const content = contentRef.current;
      const rect = content.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Reset transform
      content.style.transform = "";

      // Check horizontal collision
      if (rect.right > viewportWidth - collisionPadding) {
        const offset = rect.right - (viewportWidth - collisionPadding);
        content.style.transform = `translateX(-${offset}px)`;
      } else if (rect.left < collisionPadding) {
        const offset = collisionPadding - rect.left;
        content.style.transform = `translateX(${offset}px)`;
      }

      // Check vertical collision (flip if needed)
      if (side === "bottom" && rect.bottom > viewportHeight - collisionPadding) {
        // Flip to top
        content.style.bottom = "100%";
        content.style.top = "auto";
        content.style.marginBottom = "0.5rem";
        content.style.marginTop = "0";
      } else if (side === "top" && rect.top < collisionPadding) {
        // Flip to bottom
        content.style.top = "100%";
        content.style.bottom = "auto";
        content.style.marginTop = "0.5rem";
        content.style.marginBottom = "0";
      }
    };
    
    // Use RAF for better performance
    const rafId = requestAnimationFrame(updatePosition);
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [open, side, collisionPadding]);

  const getAlignmentClasses = () => {
    if (side === "bottom" || side === "top") {
      switch (align) {
        case "start":
          return "left-0";
        case "end":
          return "right-0";
        case "center":
          return "left-1/2 -translate-x-1/2";
        default:
          return "right-0";
      }
    }
    // For left/right sides
    switch (align) {
      case "start":
        return "top-0";
      case "end":
        return "bottom-0";
      case "center":
        return "top-1/2 -translate-y-1/2";
      default:
        return "top-0";
    }
  };

  const getSideClasses = () => {
    switch (side) {
      case "top":
        return "bottom-full mb-2";
      case "bottom":
        return "top-full mt-2";
      case "left":
        return "right-full mr-2";
      case "right":
        return "left-full ml-2";
      default:
        return "top-full mt-2";
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          ref={contentRef}
          className={cn(
            "absolute z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70",
            getSideClasses(),
            getAlignmentClasses()
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
