"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { UserRole } from "@prisma/client";
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
  Sparkles,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarBrand } from "@/components/sidebar/sidebar-brand";

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

export function Sidebar({
  userRole,
  onAssistantClick,
  collapsed = false,
}: { userRole?: UserRole; onAssistantClick?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();

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
          const actief =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          // Handle AI Assistant click
          if (item.href === "#ai-assistant") {
            return (
              <button
                key={item.href}
                onClick={onAssistantClick}
                className={cn(buttonVariants("ghost", "w-full justify-start px-3 py-2 text-sm text-left font-medium"))}
              >
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span>{item.label}</span>
              </button>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.href === "/instellingen" ? "profile-link" : item.href === "/relaties" ? "relations-link" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                actief
                  ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                  : "text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
              )}
              aria-current={actief ? "page" : undefined}
            >
              <Icon
                className={cn("h-4 w-4", actief ? "text-primary" : "text-muted-foreground")}
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Beveiliging</p>
          <p className="text-muted-foreground">
            Sessies beveiligd via NextAuth met rolgebaseerde toegang. MFA en webhooks volgen.
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={buttonVariants("outline", "w-full justify-start gap-2 px-3 py-2 text-sm font-medium")}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign Out
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
          className="absolute inset-0 bg-black/40 dark:bg-black/60"
          aria-hidden
          onClick={() => onOpenChange?.(false)}
        />
        <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85%] flex-col gap-6 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-6 text-slate-800 dark:text-slate-100 shadow-lg animate-in slide-in-from-left duration-300">
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
              const actief = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;
              
              // Handle AI Assistant click
              if (item.href === "#ai-assistant") {
                return (
                  <button
                    key={item.href}
                    onClick={() => handleItemClick(item.href)}
                    className={cn(buttonVariants("ghost", "w-full justify-start px-3 py-2.5 text-sm font-semibold text-left"))}
                  >
                    <Icon className="h-5 w-5 text-[rgb(var(--brand-primary))]" aria-hidden />
                    <span>{item.label}</span>
                  </button>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleItemClick(item.href)}
                  data-tour={item.href === "/instellingen" ? "profile-link" : item.href === "/relaties" ? "relations-link" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                    actief
                      ? "bg-[rgb(var(--brand-primary))/0.08] dark:bg-[rgb(var(--brand-primary))/0.12] text-[rgb(var(--brand-primary))] dark:text-[rgb(var(--brand-primary))] border border-[rgb(var(--brand-primary))/0.35] dark:border-[rgb(var(--brand-primary))/0.35]"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", actief ? "text-[rgb(var(--brand-primary))]" : "text-slate-500 dark:text-slate-400")}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
            <button
              onClick={() => {
                onOpenChange?.(false);
                signOut({ callbackUrl: "/" });
              }}
              className={buttonVariants("outline", "w-full justify-start gap-2 px-3 py-2.5 text-sm font-medium")}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign Out
            </button>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-center border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Powered by <span className="font-semibold text-slate-900 dark:text-slate-100">MHM IT</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
