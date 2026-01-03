"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Wallet, Settings, Plus, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/facturen", label: "Facturen", icon: Receipt },
  { href: "/uitgaven", label: "Uitgaven", icon: Wallet },
  { href: "/instellingen", label: "Instellingen", icon: Settings },
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/70 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden">
      <div className="relative flex items-center justify-around px-2 py-2">
        {navItems.slice(0, 2).map((item) => {
          const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all duration-200",
                actief
                  ? "text-indigo-600 bg-indigo-50/50"
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
            className="absolute -top-8 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Toevoegen"
          >
            <Plus className={cn("h-6 w-6 transition-transform duration-200", fabMenuOpen && "rotate-45")} aria-hidden />
          </button>
          
          {/* FAB Menu */}
          {fabMenuOpen && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 min-w-[180px] rounded-xl border border-slate-200/70 bg-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="py-2">
                <Link
                  href="/facturen/nieuw"
                  onClick={() => setFabMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <FileText className="h-5 w-5" aria-hidden />
                  Nieuwe Factuur
                </Link>
                <Link
                  href="/relaties?action=new"
                  onClick={() => setFabMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <Users className="h-5 w-5" aria-hidden />
                  Nieuwe Relatie
                </Link>
              </div>
            </div>
          )}
        </div>

        {navItems.slice(2, 4).map((item) => {
          const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all duration-200",
                actief
                  ? "text-indigo-600 bg-indigo-50/50"
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
