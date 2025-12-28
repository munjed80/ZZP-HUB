import type { ReactNode } from "react";
import "@/app/globals.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_30%)]" />
      <main className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden rounded-3xl bg-white/80 p-8 shadow-xl ring-1 ring-slate-100 backdrop-blur lg:block">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">ZZP-HUB</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              Beheer je administratie zonder gedoe.
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Facturen, uren en BTW in één plek. Start in minuten en groei door met een heldere workflow.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                <span>Transparante tarieven en duidelijke CTA&apos;s voor je klanten.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                <span>AVG-proof en ontworpen voor Nederlandse ZZP&apos;ers.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                <span>Realtime dashboards en exports wanneer je ze nodig hebt.</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
