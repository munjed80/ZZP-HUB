import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu";
import { NewActionMenu } from "@/components/layout/new-action-menu";
import { CompanySwitcher } from "@/components/layout/company-switcher";
import { DashboardClientShell } from "@/components/layout/dashboard-client-shell";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCompanyContext } from "@/lib/auth/company-context";
import { CompanyRole, UserRole } from "@prisma/client";

/**
 * Get display text for user role badge
 */
function getUserRoleBadgeText(role: UserRole): string {
  switch (role) {
    case UserRole.SUPERADMIN:
      return "Admin";
    case UserRole.ACCOUNTANT:
      return "Accountant";
    case UserRole.STAFF:
      return "Medewerker";
    case UserRole.COMPANY_ADMIN:
    default:
      return "ZZP";
  }
}

export default async function DashboardShell({ children }: { children: ReactNode }) {
  const sessie = await getServerAuthSession();
  if (!sessie?.user) {
    redirect("/login?type=zzp");
  }

  // User's actual role from the database
  const userRole = sessie.user.role;
  const userRoleBadgeText = getUserRoleBadgeText(userRole);

  // Get active company context
  const companyContext = await getActiveCompanyContext();
  const activeCompanyId = companyContext.activeCompanyId;
  // Non-owner context means viewing another company (as ACCOUNTANT or STAFF)
  const isNonOwnerMode = !companyContext.isOwnerContext;
  // Get specific role badge text for viewing context (when viewing another company)
  const contextRoleBadgeText = companyContext.activeMembership?.role === CompanyRole.ACCOUNTANT ? "Accountant toegang" 
    : companyContext.activeMembership?.role === CompanyRole.STAFF ? "Medewerker toegang" 
    : null;

  const userName = sessie.user.name || sessie.user.email || "Gebruiker";
  
  // Get profile for the active company (not the current user's profile)
  const profile = await prisma.companyProfile.findUnique({
    where: { userId: activeCompanyId },
    select: { logoUrl: true, companyName: true },
  });
  const avatarUrl = profile?.logoUrl ?? null;
  
  const memberships = companyContext.memberships;

  // Show company switcher for users who have multi-company access (ACCOUNTANT or STAFF memberships)
  const showCompanySwitcher = memberships.some((m) => 
    m.role === CompanyRole.ACCOUNTANT || m.role === CompanyRole.STAFF
  );
  
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

  // Disable actions for non-owners (they have limited permissions)
  const disableActions = isNonOwnerMode;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <DashboardClientShell userRole={sessie.user.role} avatarUrl={avatarUrl} userId={sessie.user.id} disableActions={disableActions} isAccountantMode={isNonOwnerMode}>
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-border bg-card/80 shadow-sm backdrop-blur-xl">
              <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 pt-[env(safe-area-inset-top)] md:h-16 md:px-6">
                {/* Left: Company Badge + User Role Badge */}
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
                    {/* Context Role Badge - shown when viewing another company */}
                    {contextRoleBadgeText && (
                      <span className="ml-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        {contextRoleBadgeText}
                      </span>
                    )}
                  </div>
                  {/* User Role Badge - always visible */}
                  <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary sm:inline-flex" title={`Uw rol: ${userRoleBadgeText}`}>
                    {userRoleBadgeText}
                  </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {showCompanySwitcher && (
                    <CompanySwitcher
                      currentCompanyName={profile?.companyName || "ZZP HUB"}
                      companies={memberships.map((m) => ({
                        id: m.companyId,
                        name: m.companyName || "Bedrijf",
                      }))}
                    />
                  )}
                  <NewActionMenu disabled={disableActions} />
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
