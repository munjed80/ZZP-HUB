"use client";

import { useState, type ReactNode } from "react";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AssistantDrawer } from "@/components/assistant/assistant-drawer";
import { UserRole } from "@prisma/client";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardClientShellProps = {
  children: ReactNode;
  userRole?: UserRole;
};

export function DashboardClientShell({ children, userRole }: DashboardClientShellProps) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <Sidebar userRole={userRole} onAssistantClick={() => setAssistantOpen(true)} />
      {children}
      <MobileNav 
        onAssistantClick={() => setAssistantOpen(true)}
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
      />
      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        className={cn(
          "fixed bottom-20 left-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-lg shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700 md:bottom-6 md:left-6",
        )}
        aria-label="Open AI assistent"
      >
        <Sparkles className="h-5 w-5" aria-hidden />
      </button>
      <AssistantDrawer open={assistantOpen} onOpenChange={setAssistantOpen} />
    </>
  );
}
