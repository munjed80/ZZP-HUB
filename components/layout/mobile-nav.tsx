"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Wallet, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/facturen", label: "Facturen", icon: Receipt },
  { href: "/uitgaven", label: "Uitgaven", icon: Wallet },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item, index) => {
          const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          // Insert the central "+" button before the last item
          if (index === navItems.length - 1) {
            return (
              <div key={`nav-group-${item.href}`} className="flex items-center justify-around flex-1">
                <Link
                  href="/facturen/nieuw"
                  className="flex h-14 w-14 -mt-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-lg hover:shadow-xl transition-shadow"
                  aria-label="Nieuwe factuur"
                >
                  <Plus className="h-6 w-6" aria-hidden />
                </Link>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors",
                    actief
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  aria-current={actief ? "page" : undefined}
                >
                  <Icon className={cn("h-5 w-5", actief && "stroke-[2.5]")} aria-hidden />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors",
                actief
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", actief && "stroke-[2.5]")} aria-hidden />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
