"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FileText, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const accountantNavItems = [
  { href: "/accountant-portal", label: "Portal", icon: Briefcase },
  { href: "/accountant-portal/dossier", label: "Dossiers", icon: FileText },
];

export function AccountantNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2">
        {accountantNavItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
                active ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
