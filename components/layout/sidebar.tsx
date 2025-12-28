"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigatie = [
  { href: "/dashboard", label: "Overzicht" },
  { href: "/facturen", label: "Facturen" },
  { href: "/uitgaven", label: "Uitgaven" },
  { href: "/btw-aangifte", label: "BTW-aangifte" },
  { href: "/instellingen", label: "Instellingen" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/90 px-4 py-6 shadow-sm backdrop-blur md:block">
      <div className="mb-6 px-2">
        <p className="text-lg font-semibold text-slate-900">ZZP HUB</p>
        <p className="text-sm text-slate-500">Financiën en abonnement</p>
      </div>
      <nav className="space-y-1">
        {navigatie.map((item) => {
          const actief =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                actief
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
        <p className="font-semibold">Beveiliging</p>
        <p className="text-slate-600">
          Klaar voor koppeling met NextAuth, Clerk of eigen SSO. Sessies worden
          als eerste stap afgeschermd.
        </p>
      </div>
    </aside>
  );
}
