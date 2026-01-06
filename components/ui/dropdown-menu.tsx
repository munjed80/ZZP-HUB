"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type DropdownMenuProps = {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
};

export function DropdownMenu({ trigger, children, align = "right" }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    // Use capture phase to handle clicks before they propagate
    document.addEventListener("mousedown", handleClickOutside, true);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [open]);

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
  }, [open]);

  const handleContentClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent closing when clicking inside
    e.stopPropagation();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <>
          {/* Invisible overlay to capture clicks outside */}
          <div 
            className="fixed inset-0 z-40"
            style={{ pointerEvents: "auto" }}
            aria-hidden="true"
          />
          <div
            onClick={handleContentClick}
            className={cn(
              "absolute top-full mt-2 z-50 min-w-[200px] rounded-lg border border-border bg-popover shadow-md",
              align === "right" ? "right-0" : "left-0"
            )}
            style={{ pointerEvents: "auto" }}
          >
            <div className="py-1">
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type DropdownMenuItemProps = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
};

export function DropdownMenuItem({ children, onClick, className, danger }: DropdownMenuItemProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-popover-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

type DropdownMenuSeparatorProps = {
  className?: string;
};

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={cn("my-1 h-px bg-border", className)} />;
}
