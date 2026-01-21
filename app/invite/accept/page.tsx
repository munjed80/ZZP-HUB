import { Suspense } from "react";
import type { Metadata } from "next";
import { AcceptInviteContent } from "@/app/accept-invite/accept-invite-content";

export const metadata: Metadata = {
  title: "Uitnodiging Accepteren",
  description: "Accepteer de uitnodiging om toegang te krijgen tot een bedrijf.",
};

export default function InviteAcceptPage() {
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
      <AcceptInviteContent />
    </Suspense>
  );
}
