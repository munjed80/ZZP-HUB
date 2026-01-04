"use client";

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
   LifeBuoy,
   Sparkles,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavigatieItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  superAdminOnly?: boolean;
  onClick?: () => void;
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
  { href: "#ai-assistant", label: "AI Assistent", icon: Sparkles },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/instellingen", label: "Instellingen", icon: Settings },
  { href: "/admin/companies", label: "Companies", icon: Building2, superAdminOnly: true },
];

export function Sidebar({ userRole, onAssistantClick }: { userRole?: UserRole; onAssistantClick?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-68 shrink-0 border-r border-slate-200 bg-white px-4 py-6 text-slate-800 md:flex md:flex-col">
      <div className="mb-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="space-y-0.5">
          <p className="text-lg font-semibold tracking-tight text-slate-900">ZZP HUB</p>
          <p className="text-sm text-slate-500">Financiën & abonnement</p>
        </div>
        <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
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
          
          // Handle AI Assistant click
          if (item.href === "#ai-assistant") {
            return (
              <button
                key={item.href}
                onClick={onAssistantClick}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left",
                  "text-slate-700 font-medium hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4 text-slate-500" aria-hidden />
                <span>{item.label}</span>
              </button>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                actief
                  ? "bg-teal-50 text-teal-700 font-semibold border border-teal-200"
                  : "text-slate-700 font-medium hover:bg-slate-50"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon
                className={cn("h-4 w-4", actief ? "text-teal-700" : "text-slate-500")}
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 border-t border-slate-200 pt-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Beveiliging</p>
          <p className="text-slate-600">
            Sessies beveiligd via NextAuth met rolgebaseerde toegang. MFA en webhooks volgen.
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign Out
        </button>
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-center border border-slate-200">
          <p className="text-xs font-medium text-slate-600">
            Powered by <span className="font-semibold text-slate-900">MHM IT</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar({ 
  userRole, 
  onAssistantClick,
  open = false,
  onOpenChange
}: { 
  userRole?: UserRole; 
  onAssistantClick?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const pathname = usePathname();

  const handleItemClick = (href: string) => {
    if (href === "#ai-assistant") {
      onOpenChange?.(false);
      onAssistantClick?.();
    } else {
      onOpenChange?.(false);
    }
  };

  if (!open) return null;

  return (
    <div className="md:hidden">
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/40"
          aria-hidden
          onClick={() => onOpenChange?.(false)}
        />
        <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85%] flex-col gap-6 border-r border-slate-200 bg-white px-5 py-6 text-slate-800 shadow-lg animate-in slide-in-from-left duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">ZZP-HUB</p>
              <p className="text-sm text-slate-500">Navigatie</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange?.(false)}
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
              
              // Handle AI Assistant click
              if (item.href === "#ai-assistant") {
                return (
                  <button
                    key={item.href}
                    onClick={() => handleItemClick(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors text-left",
                      "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-5 w-5 text-slate-500" aria-hidden />
                    <span>{item.label}</span>
                  </button>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleItemClick(item.href)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                    actief
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", actief ? "text-teal-700" : "text-slate-500")}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <button
              onClick={() => {
                onOpenChange?.(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign Out
            </button>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-center border border-slate-200">
              <p className="text-xs font-medium text-slate-600">
                Powered by <span className="font-semibold text-slate-900">MHM IT</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
