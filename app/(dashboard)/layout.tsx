import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu";
import { getServerAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export default async function DashboardShell({ children }: { children: ReactNode }) {
  const sessie = await getServerAuthSession();
  if (!sessie?.user) {
    redirect("/login");
  }

  const userName = sessie.user.name || sessie.user.email || "Gebruiker";
  
  // Generate initials: for names use first letters of words, for emails use first char + char after @
  let userInitials = "ZZ";
  if (userName.includes("@")) {
    // Email address: use first char and first char after @
    const parts = userName.split("@");
    userInitials = (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  } else {
    // Name: use first letters of up to 2 words
    userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar userRole={sessie.user.role} />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6 md:py-4">
            <div className="flex items-start gap-3">
              <div className="hidden md:block">
                <p className="text-sm font-bold tracking-wide text-slate-900 md:text-xs md:font-semibold md:uppercase md:tracking-wide">
                  ZZP-HUB
                </p>
                <p className="hidden text-sm text-slate-600 md:block">
                  {sessie.user.role === UserRole.SUPERADMIN ? "SuperAdmin" : "Bedrijfsbeheer"}
                </p>
              </div>
              <div className="md:hidden">
                <p className="text-sm font-bold tracking-wide text-slate-900">
                  ZZP-HUB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">Abonnement: Standaard</p>
              </div>
              <UserAvatarMenu userName={userName} userInitials={userInitials} />
            </div>
          </header>
          <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
