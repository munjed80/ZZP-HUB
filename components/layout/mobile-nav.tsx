"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/facturen", label: "Facturen", icon: Receipt },
  { href: "/uitgaven", label: "Uitgaven", icon: Wallet },
  { href: "/instellingen", label: "Instellingen", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/70 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
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
