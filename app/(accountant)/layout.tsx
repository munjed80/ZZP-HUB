import type { ReactNode } from "react";
import { getServerAuthSession } from "@/lib/auth";
import { isAccountantRole } from "@/lib/utils";
import { redirect as nextRedirect } from "next/navigation";
import { AccountantNav } from "@/components/layout/accountant-nav";

export default async function AccountantLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  const accountantLoginUrl = "/login?type=accountant";

  if (!session?.user) {
    nextRedirect(accountantLoginUrl);
  }

  if (!isAccountantRole(session.user.role) && session.user.role !== "SUPERADMIN") {
    nextRedirect(accountantLoginUrl);
  }

  return (
    <div className="min-h-screen bg-background">
      <AccountantNav />
      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  );
}
