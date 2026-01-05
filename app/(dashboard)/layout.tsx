import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu";
import { DashboardClientShell } from "@/components/layout/dashboard-client-shell";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export default async function DashboardShell({ children }: { children: ReactNode }) {
  const sessie = await getServerAuthSession();
  if (!sessie?.user) {
    redirect("/login");
  }

  const userName = sessie.user.name || sessie.user.email || "Gebruiker";
  const profile = await prisma.companyProfile.findUnique({
    where: { userId: sessie.user.id },
    select: { logoUrl: true, companyName: true },
  });
  const avatarUrl = profile?.logoUrl ?? null;
  
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
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <div className="flex min-h-screen">
        <DashboardClientShell userRole={sessie.user.role} avatarUrl={avatarUrl} userId={sessie.user.id}>
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-gradient-to-r from-white/95 via-white to-teal-50/40 px-4 pb-3 pt-[calc(0.9rem+env(safe-area-inset-top))] shadow-[0_10px_40px_-24px_rgba(15,76,92,0.35)] backdrop-blur-md md:px-6 md:py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/80 px-3 py-2 shadow-inner shadow-slate-200 ring-1 ring-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">ZZP-HUB</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {profile?.companyName || "Pro dashboard"}
                    </p>
                  </div>
                  <div className="hidden flex-col md:flex">
                    <p className="text-xs font-semibold text-teal-700">
                      {sessie.user.role === UserRole.SUPERADMIN ? "SuperAdmin" : "Beheer"}
                    </p>
                    <p className="text-xs text-slate-500">Realtime synchronisatie ingeschakeld</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-full bg-white/80 px-2 py-1 shadow-sm shadow-slate-200 ring-1 ring-slate-100 md:gap-4 md:px-3">
                  <div className="hidden flex-col text-right md:flex">
                    <p className="text-sm font-semibold text-slate-900">{userName}</p>
                    <p className="text-xs text-slate-600">Plan: Pro (€4,99 / mnd)</p>
                  </div>
                  <UserAvatarMenu userName={userName} userInitials={userInitials} avatarUrl={avatarUrl} />
                </div>
              </div>
            </header>
            <main className="flex-1 p-4 pb-24 md:p-6 md:pb-8">{children}</main>
          </div>
        </DashboardClientShell>
      </div>
    </div>
  );
}
