"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { UserRole } from "@prisma/client";
import type { ExtendedUserRole } from "@/types/roles";
import { buttonVariants } from "@/components/ui/button";
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
  X,
  LogOut,
  Rocket,
  Inbox,
  UserPlus,
  LogOut as ExitIcon,
} from "lucide-react";
import { assertUniqueHrefs, cn } from "@/lib/utils";
import { SidebarBrand } from "@/components/sidebar/sidebar-brand";

/**
 * Handler for exiting accountant context.
 * Clears the active company cookie and redirects to accountant portal.
 */
async function handleExitContext() {
  try {
    const response = await fetch("/api/context/clear-company", {
      method: "POST",
    });
    if (response.ok) {
      window.location.href = "/accountant";
    }
  } catch (error) {
    console.error("Failed to exit context:", error);
  }
}

type NavigatieItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  superAdminOnly?: boolean;
  companyAdminOnly?: boolean;
  accountantOnly?: boolean;
  /** Hide from accountants (show only to owners) */
  ownerOnly?: boolean;
  onClick?: () => void;
};

// Menu order as per requirement: Facturen, Relaties, Offertes, Uitgaven, BTW, Agenda
export const navigatie: NavigatieItem[] = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  { href: "/accountant", label: "Mijn Klanten", icon: Building2, accountantOnly: true },
  { href: "/facturen", label: "Facturen", icon: Receipt },
  { href: "/relaties", label: "Relaties", icon: Users, ownerOnly: true },
  { href: "/offertes", label: "Offertes", icon: FileSignature, ownerOnly: true },
  { href: "/uitgaven", label: "Uitgaven", icon: Wallet },
  { href: "/btw-aangifte", label: "BTW-aangifte", icon: FileText },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, ownerOnly: true },
  { href: "/uren", label: "Uren", icon: Clock3 },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/instellingen", label: "Instellingen", icon: Settings, ownerOnly: true },
  { href: "/instellingen#accountants", label: "Accountant uitnodigen", icon: UserPlus, companyAdminOnly: true },
  { href: "/admin/companies", label: "Companies", icon: Building2, superAdminOnly: true },
  { href: "/admin/releases", label: "Releases", icon: Rocket, superAdminOnly: true },
  { href: "/admin/support", label: "Support Inbox", icon: Inbox, superAdminOnly: true },
];

assertUniqueHrefs(navigatie, "Sidebar navigation");

export function Sidebar({
  userRole,
  collapsed = false,
  disableActions = false,
  isAccountantMode = false,
}: { userRole?: ExtendedUserRole; collapsed?: boolean; disableActions?: boolean; isAccountantMode?: boolean }) {
  const pathname = usePathname();
  
  // User has ACCOUNTANT role (not just viewing as accountant via CompanyUser)
  const isAccountantRole = userRole === UserRole.ACCOUNTANT;

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-border bg-card px-4 py-6 text-card-foreground md:flex md:flex-col",
        collapsed ? "w-24" : "w-68",
      )}
    >
      <SidebarBrand collapsed={collapsed} className="mb-6" />
      <nav className="flex-1 space-y-1">
        {navigatie.map((item) => {
          if (item.superAdminOnly && userRole !== UserRole.SUPERADMIN) {
            return null;
          }
          if (item.companyAdminOnly && userRole !== UserRole.COMPANY_ADMIN && userRole !== UserRole.SUPERADMIN) {
            return null;
          }
          // Show accountant-only items when user has ACCOUNTANT role OR is in accountant mode (viewing a client)
          if (item.accountantOnly && !isAccountantMode && !isAccountantRole) {
            return null;
          }
          // Hide owner-only items when in accountant mode (viewing a client's data)
          if (item.ownerOnly && isAccountantMode) {
            return null;
          }
          const actief =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          
           return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.href === "/instellingen" ? "profile-link" : item.href === "/relaties" ? "relations-link" : undefined}
              className={cn(
                 "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                 actief
                   ? "bg-gradient-to-r from-primary/15 to-primary/10 text-primary font-bold border-2 border-primary/30 shadow-lg shadow-primary/10"
                   : disableActions
                     ? "text-muted-foreground/70 pointer-events-none cursor-not-allowed"
                     : "text-muted-foreground font-semibold hover:bg-muted hover:text-foreground hover:scale-[1.02]"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon
                className={cn("h-4 w-4 transition-transform duration-200", actief ? "text-primary scale-110" : "text-muted-foreground")}
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 border-t border-border pt-4">
        {/* Exit context button for accountants viewing a client company */}
        {isAccountantMode && (
          <button
            onClick={handleExitContext}
            className="flex w-full items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm font-semibold text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-500/20"
          >
            <ExitIcon className="h-4 w-4" aria-hidden />
            Terug naar Mijn klanten
          </button>
        )}
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Beveiliging</p>
          <p className="text-muted-foreground">
            Sessies beveiligd via NextAuth met rolgebaseerde toegang. MFA en webhooks volgen.
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={buttonVariants(
            "destructive",
            "w-full justify-between gap-2 px-3 py-2 text-sm font-semibold shadow-[0_12px_48px_-16px_rgba(244,63,94,0.35)] dark:shadow-[0_12px_48px_-16px_rgba(248,113,113,0.25)]",
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Uitloggen
        </button>
        <div className="rounded-lg bg-muted/30 px-3 py-2 text-center border border-border">
          <p className="text-xs font-medium text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">MHM IT</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar({ 
  userRole, 
  open = false,
  onOpenChange,
  isAccountantMode = false,
}: { 
  userRole?: ExtendedUserRole; 
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isAccountantMode?: boolean;
}) {
  const pathname = usePathname();
  
  // User has ACCOUNTANT role (not just viewing as accountant via CompanyUser)
  const isAccountantRole = userRole === UserRole.ACCOUNTANT;

  const handleItemClick = () => {
    onOpenChange?.(false);
  };

  if (!open) return null;

  return (
    <div className="md:hidden">
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/40 dark:bg-black/60"
          aria-hidden
          onClick={() => onOpenChange?.(false)}
        />
        <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85%] flex-col gap-6 border-r border-border bg-card px-5 py-6 text-card-foreground shadow-lg animate-in slide-in-from-left duration-300">
          <div className="flex items-center justify-between">
            <SidebarBrand className="flex-1" />
            <button
              type="button"
              onClick={() => onOpenChange?.(false)}
              className="ml-3 rounded-lg p-2 text-[rgb(var(--brand-primary))] dark:text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary)/0.08)] dark:hover:bg-[rgb(var(--brand-primary)/0.12)]"
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
              // Show accountant-only items when user has ACCOUNTANT role OR is in accountant mode (viewing a client)
              if (item.accountantOnly && !isAccountantMode && !isAccountantRole) {
                return null;
              }
              if (item.companyAdminOnly && userRole !== UserRole.COMPANY_ADMIN && userRole !== UserRole.SUPERADMIN) {
                return null;
              }
              // Hide owner-only items when in accountant mode (viewing a client's data)
              if (item.ownerOnly && isAccountantMode) {
                return null;
              }
              const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleItemClick}
                  data-tour={item.href === "/instellingen" ? "profile-link" : item.href === "/relaties" ? "relations-link" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                    actief
                      ? "bg-[rgb(var(--brand-primary))/0.08] dark:bg-[rgb(var(--brand-primary))/0.12] text-[rgb(var(--brand-primary))] dark:text-[rgb(var(--brand-primary))] border border-[rgb(var(--brand-primary))/0.35] dark:border-[rgb(var(--brand-primary))/0.35]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", actief ? "text-[rgb(var(--brand-primary))]" : "text-muted-foreground")}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="space-y-3 border-t border-border pt-4">
            {/* Exit context button for accountants viewing a client company */}
            {isAccountantMode && (
              <button
                onClick={() => {
                  onOpenChange?.(false);
                  handleExitContext();
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm font-semibold text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-500/20"
              >
                <ExitIcon className="h-4 w-4" aria-hidden />
                Terug naar Mijn klanten
              </button>
            )}
            <button
              onClick={() => {
                onOpenChange?.(false);
                signOut({ callbackUrl: "/" });
              }}
              className={buttonVariants(
                "destructive",
                "w-full justify-between gap-2 px-3 py-2.5 text-sm font-semibold shadow-[0_12px_48px_-16px_rgba(244,63,94,0.35)] dark:shadow-[0_12px_48px_-16px_rgba(248,113,113,0.25)]",
              )}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Uitloggen
            </button>
            <div className="rounded-lg bg-muted px-3 py-2 text-center border border-border">
              <p className="text-xs font-medium text-muted-foreground">
                Powered by <span className="font-semibold text-foreground">MHM IT</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
