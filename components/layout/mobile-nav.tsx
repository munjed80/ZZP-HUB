"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Plus,
  FileText,
  Users,
  Send,
  Wallet,
  CalendarDays,
  Menu as MenuIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Order aligned with mobile navigation requirement: Dashboard, Facturen, Agenda, Uitgaven.
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/facturen", label: "Facturen", icon: Receipt },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/uitgaven", label: "Uitgaven", icon: Wallet },
];

const fabActions = [
  { href: "/facturen/nieuw", label: "Nieuwe Factuur", icon: FileText },
  { href: "/offertes/nieuw", label: "Nieuwe Offerte", icon: Send },
  { href: "/agenda?add=1", label: "Nieuwe Afspraak", icon: CalendarDays },
  { href: "/uitgaven?action=new", label: "Nieuwe Uitgave", icon: Receipt },
  { href: "/relaties?action=new", label: "Nieuwe Relatie", icon: Users },
];

type MobileNavProps = {
  onAssistantClick?: () => void;
  onMenuClick?: () => void;
};

export function MobileNav(mobileNavProps: MobileNavProps = {}) {
  const { onAssistantClick, onMenuClick } = mobileNavProps;
  const pathname = usePathname();
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const fabMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabMenuRef.current && !fabMenuRef.current.contains(event.target as Node)) {
        setFabMenuOpen(false);
      }
    }

    if (fabMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fabMenuOpen]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-10px_30px_-24px_rgba(var(--foreground),0.35)] backdrop-blur md:hidden pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="relative grid grid-cols-7 items-end gap-1 px-3">
        {navItems.slice(0, 2).map((item) => {
          const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-semibold leading-tight transition-colors",
                actief ? "text-primary bg-primary/10 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", actief && "stroke-[2.5]")} aria-hidden={true} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        {/* Floating Action Button (FAB) */}
        <div className="relative flex items-center justify-center" ref={fabMenuRef}>
          <button
            onClick={() => setFabMenuOpen(!fabMenuOpen)}
            data-tour="fab-add"
            className="flex h-12 w-12 -translate-y-2 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-200 hover:-translate-y-3 hover:opacity-95"
            aria-label="Toevoegen"
          >
            <Plus className={cn("h-6 w-6 transition-transform duration-200", fabMenuOpen && "rotate-45")} aria-hidden />
          </button>
          
          {/* FAB Menu */}
            {fabMenuOpen && (
              <div className="absolute bottom-16 left-1/2 min-w-[220px] -translate-x-1/2 rounded-lg border border-border bg-popover shadow-lg">
                <div className="flex flex-col divide-y divide-border py-1.5">
                  {fabActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        onClick={() => setFabMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-popover-foreground transition-colors hover:bg-accent/10"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border">
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="flex-1 text-left">{action.label}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {navItems.slice(2).map((item) => {
          const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-semibold leading-tight transition-colors",
                actief ? "text-primary bg-primary/10 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", actief && "stroke-[2.5]")} aria-hidden={true} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setFabMenuOpen(false);
            onAssistantClick?.();
          }}
          className="flex w-full min-w-[72px] flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-semibold leading-tight text-primary transition-colors hover:bg-primary/10"
          aria-label="Open AI assistent"
        >
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          <span>AI</span>
        </button>
        
        {/* Menu button - opens full navigation drawer */}
        <button
          onClick={onMenuClick}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-semibold leading-tight text-foreground transition-colors hover:bg-muted"
          aria-label="Menu"
        >
          <MenuIcon className="h-5 w-5 text-foreground" aria-hidden="true" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
