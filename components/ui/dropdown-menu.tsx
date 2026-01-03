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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-2 z-50 min-w-[200px] rounded-lg border border-slate-200/70 bg-white shadow-lg transition-all duration-200 ease-out opacity-100 scale-100",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="py-1" onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
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
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50",
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
  return <div className={cn("my-1 h-px bg-slate-200/70", className)} />;
}
