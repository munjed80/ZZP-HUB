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
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <DashboardClientShell userRole={sessie.user.role} avatarUrl={avatarUrl} userId={sessie.user.id}>
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-border/70 bg-gradient-to-r from-card/95 via-card to-[rgb(var(--brand))/0.06] px-4 pb-3 pt-[calc(0.9rem+env(safe-area-inset-top))] shadow-[0_10px_40px_-24px_rgba(var(--brand-glow,var(--brand)),0.35)] dark:shadow-[0_10px_40px_-24px_rgba(var(--brand-glow,var(--brand)),0.45)] backdrop-blur-md md:px-6 md:py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-card/80 px-3 py-2 shadow-inner shadow-[0_1px_2px_rgba(var(--border),0.45)] ring-1 ring-border/60">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">ZZP-HUB</p>
                    <p className="text-sm font-semibold text-foreground">
                      {profile?.companyName || "Pro dashboard"}
                    </p>
                  </div>
                  <div className="hidden flex-col md:flex">
                    <p className="text-xs font-semibold text-[rgb(var(--brand))]">
                      {sessie.user.role === UserRole.SUPERADMIN ? "SuperAdmin" : "Beheer"}
                    </p>
                    <p className="text-xs text-muted-foreground">Realtime synchronisatie ingeschakeld</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-full bg-card/80 px-2 py-1 shadow-sm shadow-[0_1px_2px_rgba(var(--border),0.45)] ring-1 ring-border/60 md:gap-4 md:px-3">
                  <div className="hidden flex-col text-right md:flex">
                    <p className="text-sm font-semibold text-foreground">{userName}</p>
                    <p className="text-xs text-muted-foreground">Plan: Pro (€4,99 / mnd)</p>
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
