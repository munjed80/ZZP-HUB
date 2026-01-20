import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu";
import { NewActionMenu } from "@/components/layout/new-action-menu";
import { CompanySwitcher } from "@/components/layout/company-switcher";
import { DashboardClientShell } from "@/components/layout/dashboard-client-shell";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCompanyId } from "@/lib/auth/company-context";
import { UserRole } from "@prisma/client";

export default async function DashboardShell({ children }: { children: ReactNode }) {
  const sessie = await getServerAuthSession();
  if (!sessie?.user) {
    redirect("/login?type=zzp");
  }

  if (sessie.user.role === UserRole.ACCOUNTANT) {
    redirect("/accountant-portal");
  }

  const userName = sessie.user.name || sessie.user.email || "Gebruiker";
  
  // Get active company ID (for accountants, this may differ from their userId)
  const activeCompanyId = await getActiveCompanyId();
  
  // Fetch profile for the active company
  const profile = await prisma.companyProfile.findUnique({
    where: { userId: activeCompanyId },
    select: { logoUrl: true, companyName: true },
  });
  const avatarUrl = profile?.logoUrl ?? null;
  
  // Check if user is an accountant/staff who can switch companies
  const showCompanySwitcher = 
    sessie.user.role === UserRole.ACCOUNTANT_VIEW ||
    sessie.user.role === UserRole.ACCOUNTANT_EDIT ||
    sessie.user.role === UserRole.STAFF;
  
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
            <header className="sticky top-0 z-30 border-b border-border bg-card/80 shadow-sm backdrop-blur-xl">
              <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 pt-[env(safe-area-inset-top)] md:h-16 md:px-6">
                {/* Left: Company Badge */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm">
                    {/* Logo */}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                      {profile?.logoUrl ? (
                        <Image src={profile.logoUrl} alt="" width={24} height={24} className="h-6 w-6 rounded-lg object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary-foreground">Z</span>
                      )}
                    </div>
                    {/* Company Name */}
                    <span className="truncate text-sm font-semibold text-foreground">
                      {profile?.companyName || "ZZP HUB"}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {showCompanySwitcher && (
                    <CompanySwitcher currentCompanyName={profile?.companyName || "ZZP HUB"} />
                  )}
                  <NewActionMenu />
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
