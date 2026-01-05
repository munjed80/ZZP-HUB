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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-lg backdrop-blur md:hidden pb-[calc(0.65rem+env(safe-area-inset-bottom))]">
      <div className="relative flex items-center justify-between gap-1 px-2 py-2">
        {navItems.slice(0, 2).map((item) => {
          const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-colors",
                actief
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", actief && "stroke-[2.5]")} aria-hidden={true} />
              <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Floating Action Button (FAB) */}
        <div className="relative flex-1 flex justify-center" ref={fabMenuRef}>
          <button
            onClick={() => setFabMenuOpen(!fabMenuOpen)}
            data-tour="fab-add"
            className="absolute -top-7 flex h-12 w-12 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5 hover:opacity-90"
            aria-label="Toevoegen"
          >
            <Plus className={cn("h-6 w-6 transition-transform duration-200", fabMenuOpen && "rotate-45")} aria-hidden />
          </button>
          
          {/* FAB Menu */}
            {fabMenuOpen && (
              <div className="absolute bottom-20 left-1/2 min-w-[220px] -translate-x-1/2 rounded-lg border border-border bg-popover shadow-lg">
                <div className="flex flex-col divide-y divide-border py-1.5">
                  {fabActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        onClick={() => setFabMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border">
                          <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="flex-1">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {navItems.slice(2, 3).map((item) => {
          const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-colors",
                actief
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", actief && "stroke-[2.5]")} aria-hidden={true} />
              <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setFabMenuOpen(false);
            onAssistantClick?.();
          }}
          className="flex flex-1 min-w-[72px] flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[rgb(var(--brand-primary))] transition-colors hover:bg-[rgb(var(--brand-primary)/0.08)] hover:text-[rgb(var(--brand-primary-active))]"
          aria-label="Open AI assistent"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          <span className="text-[10px] font-semibold leading-tight">AI</span>
        </button>
        
        {/* Menu button - opens full navigation drawer */}
        <button
          onClick={onMenuClick}
          className="flex flex-1 flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-colors text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary)/0.08)] hover:text-[rgb(var(--brand-primary-active))]"
          aria-label="Menu"
        >
          <MenuIcon className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-semibold leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
