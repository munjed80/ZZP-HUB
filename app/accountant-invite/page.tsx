import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AccountantVerifyContent } from "../accountant-verify/accountant-verify-content";

export const metadata: Metadata = {
  title: "Accountant uitnodiging",
  description: "Bevestig je toegang met je accountant-account.",
};

export default async function AccountantInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedParams = await searchParams;
  const session = await getServerAuthSession();
  const tokenParam = resolvedParams?.token ? `?token=${encodeURIComponent(resolvedParams.token)}` : "";
  const currentUrl = `/accountant-invite${tokenParam}`;

  if (!session?.user) {
    redirect(`/login?type=accountant&next=${encodeURIComponent(currentUrl)}`);
  }

  const isAccountant = session.user.role === "ACCOUNTANT";

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Laden...</p>
          </div>
        </div>
      }
    >
      <AccountantVerifyContent isAccountant={isAccountant} />
    </Suspense>
  );
}
