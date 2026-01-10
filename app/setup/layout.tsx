import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerAuthSession } from "@/lib/auth";

export default async function SetupLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  const requiresVerification = session.user.role !== "SUPERADMIN" && !session.user.emailVerified;
  if (requiresVerification) {
    redirect("/verify-required");
  }

  const cookieStore = await cookies();
  const onboardingCookie = cookieStore.get("zzp-hub-onboarding-completed")?.value === "true";
  if (session.user.onboardingCompleted || onboardingCookie) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {children}
      </div>
    </div>
  );
}
