"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Plus, FileText, Users, Send, Wallet, CalendarDays } from "lucide-react";
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

export function MobileNav() {
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white shadow-sm md:hidden">
      <div className="relative flex items-center justify-around px-2 py-2">
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
                  ? "text-teal-700 bg-teal-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
            className="absolute -top-8 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-md border border-teal-700 hover:bg-teal-700 transition-colors"
            aria-label="Toevoegen"
          >
            <Plus className={cn("h-6 w-6 transition-transform duration-200", fabMenuOpen && "rotate-45")} aria-hidden />
          </button>
          
          {/* FAB Menu */}
            {fabMenuOpen && (
              <div className="absolute bottom-20 left-1/2 min-w-[220px] -translate-x-1/2 rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="flex flex-col divide-y divide-slate-100 py-1.5">
                  {fabActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        onClick={() => setFabMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 hover:text-teal-700"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
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

        {navItems.slice(2).map((item) => {
          const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-colors",
                actief
                  ? "text-teal-700 bg-teal-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", actief && "stroke-[2.5]")} aria-hidden={true} />
              <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
