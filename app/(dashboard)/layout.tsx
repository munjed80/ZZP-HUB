import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { MobileSidebar, Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
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
    <div className="min-h-screen bg-transparent">
      <div className="flex min-h-screen">
        <Sidebar userRole={sessie.user.role} />
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
            <div className="flex items-start gap-3">
              <MobileSidebar userRole={sessie.user.role} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  ZZP HUB
                </p>
                <p className="text-sm text-slate-600">
                  {sessie.user.role === UserRole.SUPERADMIN ? "SuperAdmin" : "Bedrijfsbeheer"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">Abonnement: Standaard</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-800 text-sm font-semibold text-white">
                {userInitials}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 pb-20 md:pb-6">{children}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
