"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  FileSignature,
  Wallet,
  Clock3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigatie = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  { href: "/relaties", label: "Relaties", icon: Users },
  { href: "/facturen", label: "Facturen", icon: Receipt },
  { href: "/offertes", label: "Offertes", icon: FileSignature },
  { href: "/uitgaven", label: "Uitgaven", icon: Wallet },
  { href: "/uren", label: "Uren", icon: Clock3 },
  { href: "/btw-aangifte", label: "BTW-aangifte", icon: FileText },
  { href: "/instellingen", label: "Instellingen", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-68 shrink-0 border-r border-slate-200 bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6 text-slate-100 shadow-lg md:block">
      <div className="mb-6 px-2">
        <p className="text-lg font-semibold text-white">ZZP HUB</p>
        <p className="text-sm text-slate-200">Financiën & abonnement</p>
      </div>
      <nav className="space-y-1">
        {navigatie.map((item) => {
          const actief =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                actief
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-100 hover:bg-slate-700/60"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 rounded-lg bg-white/10 p-3 text-sm text-slate-100 ring-1 ring-white/10">
        <p className="font-semibold">Beveiliging</p>
        <p className="text-slate-200">
          Klaar voor koppeling met NextAuth, Clerk of SSO. Sessies worden
          afgeschermd; MFA en webhooks volgen.
        </p>
      </div>
    </aside>
  );
}
