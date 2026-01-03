import type { ReactNode } from "react";
import { ArrowRight, Quote, ShieldCheck, Sparkles } from "lucide-react";
import "@/app/globals.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute right-2 top-0 h-80 w-80 rounded-full bg-indigo-400/20 blur-[120px]" />
        <div className="absolute inset-x-6 top-[28%] h-48 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />
      </div>
      <main className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-indigo-700 via-indigo-600 to-slate-900 p-10 text-white shadow-[0_30px_120px_-60px_rgba(79,70,229,0.55)] ring-1 ring-indigo-200/40 backdrop-blur-2xl lg:block">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 -top-14 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute right-4 top-10 h-36 w-36 rounded-full bg-indigo-300/20 blur-2xl" />
              <div className="absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-indigo-900/40 blur-3xl" />
            </div>
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100 ring-1 ring-white/20">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  ZZP-HUB
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Beheer je administratie zonder gedoe.
                </h1>
                <p className="text-base text-indigo-100/90">
                  Facturen, uren en BTW in één plek. Start in minuten en groei door met een heldere workflow en
                  Nederlandse support.
                </p>
              </div>
              <div className="space-y-3 text-sm text-indigo-50/90">
                <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm backdrop-blur">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold">
                    01
                  </span>
                  <span>Transparante tarieven, automatische opvolging en luxueuze klantportalen.</span>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm backdrop-blur">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold">
                    02
                  </span>
                  <span>AVG-proof workflows en beveiligde opslag voor Nederlandse ZZP&apos;ers.</span>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm backdrop-blur">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold">
                    03
                  </span>
                  <span>Realtime dashboards met cashflow en prognoses zonder spreadsheets.</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start gap-3 text-indigo-50">
                  <Quote className="mt-0.5 h-5 w-5 text-indigo-200" aria-hidden />
                  <p className="text-sm">
                    “Binnen een week hebben we facturen geautomatiseerd en BTW klaarstaan. De ervaring voelt als een
                    premium SaaS.”
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-indigo-100/90">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  <span>Beveiligde sessies en exporteerbare audit trails.</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white ring-1 ring-white/20">
                  Volgende stap in <span className="inline-flex items-center gap-1">je flow <ArrowRight className="h-3.5 w-3.5" aria-hidden /></span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-xl">
            <div
              className="pointer-events-none absolute inset-0 -z-10 translate-y-2 rounded-[32px] bg-white/70 shadow-[0_30px_120px_-70px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/60 backdrop-blur-xl"
              aria-hidden
            />
            <div className="relative">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
