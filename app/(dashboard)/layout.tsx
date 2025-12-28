import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { getDemoSessie } from "@/lib/auth";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const sessie = getDemoSessie();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">
                ZZP HUB
              </p>
              <p className="text-sm text-slate-600">
                Sessiebeveiliging actief als placeholder – koppel later je
                identiteit of SSO-provider.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {sessie.gebruiker}
                </p>
                <p className="text-xs text-slate-500">
                  Abonnement: {sessie.abonnement}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-semibold text-white">
                ZZ
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
