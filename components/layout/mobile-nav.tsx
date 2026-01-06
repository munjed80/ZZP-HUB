"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
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

type MobileNavProps = {
  onAssistantClick?: () => void;
  onMenuClick?: () => void;
};

export function MobileNav(mobileNavProps: MobileNavProps = {}) {
  const { onAssistantClick, onMenuClick } = mobileNavProps;
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-10px_30px_-24px_rgba(var(--foreground),0.35)] backdrop-blur md:hidden pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="relative grid grid-cols-6 items-end gap-1 px-3">
        {navItems.map((item) => {
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
