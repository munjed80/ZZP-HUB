"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { UserRole } from "@prisma/client";
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  FileText,
  Receipt,
  FileSignature,
  Wallet,
  Clock3,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavigatieItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  superAdminOnly?: boolean;
};

export const navigatie: NavigatieItem[] = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/relaties", label: "Relaties", icon: Users },
  { href: "/facturen", label: "Facturen", icon: Receipt },
  { href: "/offertes", label: "Offertes", icon: FileSignature },
  { href: "/uitgaven", label: "Uitgaven", icon: Wallet },
  { href: "/uren", label: "Uren", icon: Clock3 },
  { href: "/btw-aangifte", label: "BTW-aangifte", icon: FileText },
  { href: "/instellingen", label: "Instellingen", icon: Settings },
  { href: "/admin/companies", label: "Companies", icon: Building2, superAdminOnly: true },
];

export function Sidebar({ userRole }: { userRole?: UserRole }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-68 shrink-0 border-r border-[#d5dae0] bg-white/92 px-4 py-6 text-slate-800 shadow-[0_24px_80px_-50px_rgba(13,148,136,0.3)] backdrop-blur-xl md:flex md:flex-col">
      <div className="mb-6 flex items-center justify-between rounded-xl border border-[#d5dae0] bg-white/90 px-3 py-3 shadow-[0_12px_38px_-28px_rgba(13,148,136,0.28)]">
        <div className="space-y-0.5">
          <p className="text-lg font-semibold tracking-tight text-slate-900">ZZP HUB</p>
          <p className="text-sm text-slate-500">Financiën & abonnement</p>
        </div>
        <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 shadow-sm">
          Pro
        </span>
      </div>
      <nav className="flex-1 space-y-1">
        {navigatie.map((item) => {
          if (item.superAdminOnly && userRole !== UserRole.SUPERADMIN) {
            return null;
          }
          const actief =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                actief
                  ? "bg-teal-50 text-teal-700 font-semibold shadow-sm ring-1 ring-teal-200"
                  : "text-slate-700 font-medium hover:-translate-y-0.5 hover:bg-slate-100"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon
                className={cn("h-4 w-4 transition-colors", actief ? "text-teal-700" : "text-slate-500")}
                aria-hidden
              />
              <span className={cn("transition-colors", actief && "text-teal-700")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 border-t border-[#d5dae0] pt-4">
        <div className="rounded-xl border border-[#d5dae0] bg-white/90 p-3 text-sm text-slate-700 shadow-[0_12px_34px_-24px_rgba(13,148,136,0.22)] backdrop-blur">
          <p className="font-semibold text-slate-900">Beveiliging</p>
          <p className="text-slate-600">
            Sessies beveiligd via NextAuth met rolgebaseerde toegang. MFA en webhooks volgen.
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-lg border border-[#d5dae0] bg-white/90 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign Out
        </button>
        <div className="rounded-lg bg-slate-50/50 px-3 py-2 text-center">
          <p className="text-xs font-medium text-slate-600">
            Powered by <span className="font-semibold text-slate-900">MHM IT</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar({ userRole }: { userRole?: UserRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-[#d5dae0] hover:bg-slate-50"
        aria-label="Open navigatie"
      >
        <Menu className="h-5 w-5" aria-hidden />
        <span className="sr-only">Menu</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85%] flex-col gap-6 border-r border-[#d5dae0] bg-white/95 px-5 py-6 text-slate-800 shadow-[25px_0_80px_-45px_rgba(13,148,136,0.35)] backdrop-blur-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="shimmer-text text-xl font-bold tracking-tight">ZZP-HUB</p>
                <p className="text-sm text-slate-500">Navigatie</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                aria-label="Sluit menu"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navigatie.map((item) => {
                if (item.superAdminOnly && userRole !== UserRole.SUPERADMIN) {
                  return null;
                }
                const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                      actief
                        ? "bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-200"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5 transition-colors", actief ? "text-teal-700" : "text-slate-500")}
                      aria-hidden
                    />
                    <span className={cn("transition-colors", actief && "text-teal-700")}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="space-y-3 border-t border-[#d5dae0] pt-4">
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-[#d5dae0] bg-white/90 px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign Out
              </button>
              <div className="rounded-lg bg-slate-50/50 px-3 py-2 text-center">
                <p className="text-xs font-medium text-slate-600">
                  Powered by <span className="font-semibold text-slate-900">MHM IT</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
