import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // SUPERADMIN bypasses email verification to ensure immediate admin access
  const requiresVerification = session.user.role !== 'SUPERADMIN' && !session.user.emailVerified;
  if (requiresVerification) {
    redirect("/verify-required");
  }

  if (session.user.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {children}
      </div>
    </div>
  );
}
