import { AccountantAccessContent } from "./accountant-access-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accountant Toegang",
  description: "Beheer toegang voor accountants tot uw bedrijfsgegevens.",
};

export default function AccountantAccessPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted border-b border-border px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Accountant Toegang
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Nodig accountants uit om toegang te krijgen tot uw bedrijfsgegevens
          </p>
        </div>
      </div>

      <AccountantAccessContent />
    </div>
  );
}
