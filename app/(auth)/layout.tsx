import type { ReactNode } from "react";
import "@/app/globals.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-indigo-400/20 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />
      </div>
      <main className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden rounded-3xl border border-slate-200/70 bg-white/70 p-10 shadow-[0_30px_120px_-60px_rgba(79,70,229,0.35)] ring-1 ring-white/70 backdrop-blur-2xl lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">ZZP-HUB</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Beheer je administratie zonder gedoe.
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Facturen, uren en BTW in één plek. Start in minuten en groei door met een heldere workflow.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm">
                <span className="mt-1 h-2 w-2 rounded-full bg-indigo-600" />
                <span>Transparante tarieven en duidelijke CTA&apos;s voor je klanten.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm">
                <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                <span>AVG-proof en ontworpen voor Nederlandse ZZP&apos;ers.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm">
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
