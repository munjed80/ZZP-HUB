"use client";

import { createContext, useSyncExternalStore, useState, type ReactNode } from "react";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AssistantDrawer } from "@/components/assistant/assistant-drawer";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import type { ExtendedUserRole } from "@/types/roles";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCAL_PROFILE_STORAGE_KEY } from "@/lib/constants";

export const AvatarContext = createContext<string | null>(null);

type DashboardClientShellProps = {
  children: ReactNode;
  userRole?: ExtendedUserRole;
  avatarUrl?: string | null;
  userId: string;
  disableActions?: boolean;
  isAccountantMode?: boolean;
};

export function DashboardClientShell({ children, userRole, avatarUrl: serverAvatarUrl, disableActions, isAccountantMode = false }: DashboardClientShellProps) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const avatarUrl = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const handleStorage = (event: StorageEvent) => {
        if (event.key === LOCAL_PROFILE_STORAGE_KEY) {
          callback();
        }
      };
      const handleAvatarEvent = () => callback();
      window.addEventListener("storage", handleStorage);
      window.addEventListener("zzp-hub-avatar-updated", handleAvatarEvent as EventListener);
      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("zzp-hub-avatar-updated", handleAvatarEvent as EventListener);
      };
    },
    () => {
      if (typeof window === "undefined") return serverAvatarUrl ?? null;
      const cached = window.localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { avatar?: string | null };
          if (parsed?.avatar) return parsed.avatar;
        } catch (error) {
          // Silently ignore localStorage parse errors in production
          if (process.env.NODE_ENV !== "production") {
            console.warn("Could not load avatar from localStorage", error);
          }
        }
      }
      return serverAvatarUrl ?? null;
    },
    () => serverAvatarUrl ?? null,
  );

  return (
    <AvatarContext.Provider value={avatarUrl}>
      <Sidebar userRole={userRole} disableActions={disableActions} isAccountantMode={isAccountantMode} />
      {/* Mobile hamburger menu button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card shadow-md transition-all hover:bg-muted md:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {children}
      <MobileNav
        userRole={userRole}
        onMenuClick={() => setMobileMenuOpen(true)}
      />
      <MobileSidebar
        userRole={userRole}
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        onAssistantClick={() => {
          setMobileMenuOpen(false);
          setAssistantOpen(true);
        }}
        isAccountantMode={isAccountantMode}
      />
      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        className={cn(
          "fixed right-3 z-40 hidden h-11 w-11 items-center justify-center rounded-full border border-[rgb(var(--brand-primary))/0.35] bg-[rgb(var(--brand-primary))/0.12] text-[rgb(var(--brand-primary))] shadow-lg shadow-[0_12px_32px_-18px_rgba(var(--brand-primary),0.65)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[rgb(var(--brand-primary))] md:inline-flex md:right-6",
          "md:bottom-8"
        )}
        aria-label="Open AI assistent"
      >
        <Sparkles className="h-5 w-5" aria-hidden />
      </button>
      <AssistantDrawer open={assistantOpen} onOpenChange={setAssistantOpen} />
      <AssistantWidget />
    </AvatarContext.Provider>
  );
}
