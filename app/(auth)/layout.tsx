"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Quote, ShieldCheck, Sparkles } from "lucide-react";
import "@/app/globals.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative overflow-hidden bg-[#04060f] text-white">
          <motion.div
            className="absolute -left-10 top-4 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl"
            animate={{ y: [0, -10, 6, 0], x: [0, 6, -6, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-0 bottom-10 h-72 w-72 rounded-full bg-purple-500/25 blur-[120px]"
            animate={{ x: [0, -12, 6, 0], y: [0, 8, -8, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-20 rounded-[32px] bg-gradient-to-br from-indigo-900/70 via-indigo-700/60 to-slate-900/70 opacity-70 blur-3xl"
            animate={{ scale: [1, 1.04, 1], rotate: [0, 1.5, -1.5, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex h-full flex-col justify-between px-10 py-16 sm:px-14">
            <div className="space-y-5">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100 ring-1 ring-white/10">
                <Sparkles className="h-4 w-4" aria-hidden />
                Cinematic login
              </p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Stap in de premium flow.</h1>
              <p className="max-w-xl text-base text-indigo-100/90">
                Mesh gradients, beveiligde sessies en een invisible interface. Beheer facturen, uren en BTW alsof je in
                een filmset van Apple zit.
              </p>
            </div>
            <div className="space-y-4 text-sm text-indigo-50/90">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-sm backdrop-blur-xl">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold">
                  01
                </span>
                <span>Laag voor laag glasdesign, met live timers en facturen.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-sm backdrop-blur-xl">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold">
                  02
                </span>
                <span>Deep-dark mesh met veilige opslag en audit trails.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-sm backdrop-blur-xl">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold">
                  03
                </span>
                <span>Framer Motion reveals: elke stap voelt choreografeerd.</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-start gap-3 text-indigo-50">
                <Quote className="mt-0.5 h-5 w-5 text-indigo-200" aria-hidden />
                <p className="text-sm">
                  “Login voelt eindelijk premium. Invisible inputs, mesh glow en een flow die je laat doorwerken.”
                </p>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-indigo-100/90">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                <span>End-to-end beveiligd, powered by MHM IT.</span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-white/10">
                Volgende stap in <span className="inline-flex items-center gap-1">je flow <ArrowRight className="h-3.5 w-3.5" aria-hidden /></span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center bg-white">
          <div className="absolute inset-y-0 left-0 w-px bg-slate-100" aria-hidden />
          <div className="absolute -left-24 top-10 hidden h-40 w-40 rounded-full bg-indigo-100/40 blur-3xl sm:block" />
          <div className="absolute right-6 top-0 h-32 w-32 rounded-full bg-indigo-200/50 blur-3xl" />
          <div className="relative w-full max-w-md px-6 py-12 sm:px-10 sm:py-16">{children}</div>
        </div>
      </div>
    </div>
  );
}
