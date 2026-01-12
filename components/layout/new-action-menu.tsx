"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Send, CalendarDays, Receipt, Users, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

const createActions = [
  { href: "/facturen/nieuw", label: "Nieuwe factuur", icon: FileText },
  { href: "/offertes/nieuw", label: "Nieuwe offerte", icon: Send },
  { href: "/relaties?action=new", label: "Nieuwe klant", icon: Users },
  { href: "/uitgaven?action=new", label: "Nieuwe uitgave", icon: Receipt },
  { href: "/agenda?add=1", label: "Nieuwe agenda-item", icon: CalendarDays },
  { href: "/uren?action=new", label: "Nieuwe urenregistratie", icon: Clock3 },
];

export function NewActionMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleActionClick = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (index + 1) % createActions.length;
      const nextButton = document.querySelector(`[data-menu-item="${nextIndex}"]`) as HTMLButtonElement;
      nextButton?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex = (index - 1 + createActions.length) % createActions.length;
      const prevButton = document.querySelector(`[data-menu-item="${prevIndex}"]`) as HTMLButtonElement;
      prevButton?.focus();
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl",
          "bg-primary text-primary-foreground",
          "border border-primary/80",
          "shadow-sm hover:shadow-md",
          "transition-all duration-200",
          "hover:scale-[1.02] active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-label="Nieuw item aanmaken"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Plus className={cn("h-5 w-5 transition-transform duration-200", open && "rotate-45")} aria-hidden />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 z-50 min-w-[240px] rounded-2xl",
            "border-2 border-border bg-popover shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
          role="menu"
        >
          <div className="py-2">
            {createActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  data-menu-item={index}
                  onClick={() => handleActionClick(action.href)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 mx-1.5 rounded-xl",
                    "text-sm font-semibold text-popover-foreground",
                    "transition-all duration-200 hover:bg-primary/10 hover:scale-[1.02]",
                    "focus-visible:outline-none focus-visible:bg-primary/10"
                  )}
                  role="menuitem"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600/20 to-teal-600/10 text-emerald-700 border-2 border-emerald-600/30 shadow-sm">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="flex-1 text-left">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
