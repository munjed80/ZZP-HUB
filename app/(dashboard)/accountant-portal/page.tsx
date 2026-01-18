import { AccountantPortalContent } from "./accountant-portal-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accountant Portal",
  description: "Overzicht van bedrijven waartoe u toegang heeft.",
};

export default function AccountantPortalPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted border-b border-border px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Accountant Portal
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Beheer meerdere bedrijven vanuit één plek
          </p>
        </div>
      </div>

      <AccountantPortalContent />
    </div>
  );
}
