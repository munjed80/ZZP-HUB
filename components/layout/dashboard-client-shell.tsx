"use client";

import { useState, type ReactNode } from "react";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AssistantDrawer } from "@/components/assistant/assistant-drawer";
import { UserRole } from "@prisma/client";

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
      <AssistantDrawer open={assistantOpen} onOpenChange={setAssistantOpen} />
    </>
  );
}
