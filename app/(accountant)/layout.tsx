import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { isAccountantRole } from "@/lib/utils";
import { redirect as nextRedirect } from "next/navigation";

export default async function AccountantLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  const accountantLoginUrl = "/login?type=accountant";

  if (!session?.user) {
    nextRedirect(accountantLoginUrl);
  }

  if (!isAccountantRole(session.user.role) && session.user.role !== "SUPERADMIN") {
    nextRedirect(accountantLoginUrl);
  }

  // Keep this shell minimal to avoid duplicating the dashboard navigation on accountant pages
  return <div className="min-h-screen bg-background">{children}</div>;
}
