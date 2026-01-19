import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { isAccountantRole } from "@/lib/utils";

export default async function AccountantLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAccountantRole(session.user.role)) {
    redirect("/dashboard");
  }

  // Keep this shell minimal to avoid duplicating the dashboard navigation on accountant pages
  return <div className="min-h-screen bg-background">{children}</div>;
}
