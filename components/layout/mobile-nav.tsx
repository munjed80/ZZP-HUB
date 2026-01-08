"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  CalendarDays,
  Menu as MenuIcon,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Order aligned with mobile navigation requirement: Dashboard, Facturen, Agenda, Uitgaven.
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/facturen", label: "Facturen", icon: Receipt },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/uitgaven", label: "Uitgaven", icon: Wallet },
];

type MobileNavProps = {
  onMenuClick?: () => void;
};

export function MobileNav(mobileNavProps: MobileNavProps = {}) {
  const { onMenuClick } = mobileNavProps;
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-10px_28px_-20px_rgba(15,23,42,0.18)] backdrop-blur-md md:hidden pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="relative grid grid-cols-6 items-end gap-1 px-3">
        {navItems.map((item) => {
          const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-bold leading-tight transition-all duration-200",
                actief 
                  ? "text-primary bg-gradient-to-br from-primary/15 to-primary/10 shadow-lg border-2 border-primary/30 scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted hover:scale-[1.02]"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5 transition-transform duration-200", actief && "stroke-[2.5] scale-110")} aria-hidden={true} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/instellingen"
          className={cn(
            "flex w-full min-w-[72px] flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-bold leading-tight transition-all duration-200",
            pathname === "/instellingen" || pathname?.startsWith("/instellingen/")
              ? "text-primary bg-gradient-to-br from-primary/15 to-primary/10 shadow-lg border-2 border-primary/30 scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-muted hover:scale-[1.02]"
          )}
          aria-label="Instellingen"
          aria-current={pathname === "/instellingen" || pathname?.startsWith("/instellingen/") ? "page" : undefined}
        >
          <Settings className={cn("h-5 w-5 transition-transform duration-200", (pathname === "/instellingen" || pathname?.startsWith("/instellingen/")) && "stroke-[2.5] scale-110")} aria-hidden />
          <span>Instellingen</span>
        </Link>
        
        {/* Menu button - opens full navigation drawer */}
        <button
          onClick={onMenuClick}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-bold leading-tight text-foreground transition-all duration-200 hover:bg-muted hover:scale-[1.02]"
          aria-label="Menu"
        >
          <MenuIcon className="h-5 w-5 text-foreground" aria-hidden="true" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
