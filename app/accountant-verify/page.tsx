import { AccountantVerifyContent } from "./accountant-verify-content";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accountant Toegang",
  description: "Voer uw verificatiecode in om toegang te krijgen.",
};

export default function AccountantVerifyPage() {
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
      <AccountantVerifyContent />
    </Suspense>
  );
}
