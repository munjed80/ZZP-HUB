"use client";

import Link from "next/link";
import { motion, type MotionProps, type TargetAndTransition, type Transition } from "framer-motion";
import { ArrowRight, Calculator, CheckCircle2, FileText, Timer, Sparkles, ShieldCheck, LineChart, Infinity } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Facturatie",
    description:
      "Professionele facturen met één klik, automatische opvolging en realtime betaalsignalen.",
    icon: FileText,
  },
  {
    title: "BTW-aangifte",
    description:
      "Automatische BTW-berekeningen en rapportages. Altijd klaar voor je kwartaalaangifte.",
    icon: Calculator,
  },
  {
    title: "Urenregistratie",
    description: "Houd moeiteloos je 1225-uren criterium bij en koppel aan projecten.",
    icon: Timer,
  },
  {
    title: "Compliance",
    description: "AVG-proof workflows, veilige opslag en exporteerbare audit trails.",
    icon: ShieldCheck,
  },
  {
    title: "Rapportages",
    description: "Premium dashboards met cashflow, marges en prognoses in één oogopslag.",
    icon: LineChart,
  },
];

const elitePerks = [
  "Layered dashboards met realtime data",
  "Indigo Glow beveiliging en 2FA",
  "Premium support in het Nederlands",
  "Automatische BTW en export-ready PDF's",
  "Project timers & smart reminders",
  "14 dagen volledig gratis proberen",
];

const trustLogos = ["Delta Studio", "Noord Agency", "Kracht Consulting", "Studio Blink", "Peak Devs", "Atelier 6"];

const glassStats = [
  {
    label: "Maand-omzet",
    value: "€12.480",
    chip: "+18% vs vorige maand",
    icon: LineChart,
    accent: "from-indigo-500 to-purple-500",
  },
  {
    label: "Openstaand",
    value: "€2.130",
    chip: "3 facturen",
    icon: FileText,
    accent: "from-amber-400 to-orange-400",
  },
  {
    label: "Focus sprint",
    value: "06:24:18",
    chip: "Timer live",
    icon: Timer,
    accent: "from-emerald-400 to-teal-500",
  },
];

const glassPayments = [
  { klant: "Peak Devs", bedrag: "€1.420", status: "Betaald" },
  { klant: "Studio Blink", bedrag: "€980", status: "In review" },
  { klant: "Noord Agency", bedrag: "€760", status: "Betaald" },
];

const glassFlow = [
  { label: "BTW-sync klaar", icon: ShieldCheck, tone: "text-emerald-100 bg-emerald-500/10 ring-emerald-300/20" },
  { label: "Rapportage live", icon: Sparkles, tone: "text-indigo-50 bg-indigo-500/10 ring-indigo-300/30" },
  { label: "Automatische incasso", icon: Calculator, tone: "text-amber-50 bg-amber-500/10 ring-amber-300/30" },
];

type FadeUpProps = MotionProps & {
  whileInView: TargetAndTransition & { transition: Transition };
};

const fadeUp: FadeUpProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  viewport: { once: true, amount: 0.3 },
};

const fadeUpTransition = (delay: number): Transition => ({
  ...fadeUp.whileInView.transition,
  delay,
});

const staggeredCard = (delay: number): MotionProps => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay } },
  viewport: { once: true, amount: 0.2 },
});

const tiltEffect = {
  whileHover: { rotateX: -6, rotateY: 6, translateY: -10, scale: 1.01 },
  transition: { type: "spring" as const, stiffness: 140, damping: 16 },
  style: { transformStyle: "preserve-3d" as const },
};

export function LandingContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  const primaryCta = isLoggedIn ? "Naar Dashboard" : "Gratis starten";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f6fb] via-white to-[#eef0ff] text-slate-900">
      <header className="sticky top-4 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between rounded-full border border-white/20 bg-white/70 px-4 py-3 shadow-2xl backdrop-blur-md">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 via-white to-slate-500 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.45)] ring-1 ring-white/60">
                <Sparkles className="h-5 w-5 text-slate-700" aria-hidden />
              </div>
              <motion.span
                className="shimmer-text text-xl font-semibold tracking-tight drop-shadow-[0_6px_28px_rgba(79,70,229,0.25)]"
                transition={{ duration: 0.6 }}
              >
                ZZP-HUB
              </motion.span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
              <Link href="#features" className="transition-colors duration-200 hover:text-indigo-600">
                Features
              </Link>
              <Link href="#pricing" className="transition-colors duration-200 hover:text-indigo-600">
                Prijzen
              </Link>
              <Link href="#preview" className="transition-colors duration-200 hover:text-indigo-600">
                Preview
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className={buttonVariants(
                    "primary",
                    "shadow-lg shadow-indigo-500/25 px-5 py-2.5 text-sm tracking-tight"
                  )}
                >
                  Naar Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className={buttonVariants("ghost", "hidden md:inline-flex text-slate-700")}>
                    Inloggen
                  </Link>
                  <Link
                    href="/register"
                    className={buttonVariants(
                      "primary",
                      "shadow-lg shadow-indigo-500/25 px-5 py-2.5 text-sm tracking-tight"
                    )}
                  >
                    Gratis starten
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16 sm:pt-20">
        <section
          id="preview"
          className="relative overflow-hidden pb-24 pt-20 sm:pt-24 lg:pt-28"
        >
          <div className="absolute inset-0">
            <div className="absolute -left-32 top-6 h-72 w-72 rounded-full bg-indigo-200/35 blur-3xl" />
            <div className="absolute right-6 top-[-40px] h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#eef0ff]" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <motion.div
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700 shadow-sm backdrop-blur"
                  {...fadeUp}
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  <span>Super Premium SaaS</span>
                </motion.div>
                <motion.h1
                  className="text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-900 sm:text-6xl lg:text-7xl"
                  {...fadeUp}
                  transition={fadeUpTransition(0.05)}
                  style={{
                    backgroundImage: "linear-gradient(110deg,#e5e7eb,#94a3b8,#0f172a)",
                    backgroundSize: "140% 140%",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  De nieuwe standaard voor Nederlandse ZZP&apos;ers.
                </motion.h1>
                <motion.p
                  className="max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl"
                  {...fadeUp}
                  transition={fadeUpTransition(0.1)}
                >
                  Een gelaagde, glasheldere ervaring met live dashboards, zwevende glaslagen en een magnetic flow. Luxe
                  genoeg voor Apple, snel genoeg voor Stripe, en helder als Linear.
                </motion.p>
                <motion.div
                  className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
                  {...fadeUp}
                  transition={fadeUpTransition(0.15)}
                >
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/register"}
                    className={buttonVariants(
                      "primary",
                      "text-base px-8 py-3 shadow-xl shadow-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/40"
                    )}
                  >
                    {primaryCta}
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                  </Link>
                  <Link
                    href="#pricing"
                    className={buttonVariants(
                      "secondary",
                      "text-base px-8 py-3 border border-slate-200/80 bg-white/80 shadow-sm hover:-translate-y-0.5"
                    )}
                  >
                    Bekijk prijs
                  </Link>
                </motion.div>
                <motion.div
                  className="flex items-center gap-3 text-sm text-slate-600"
                  {...fadeUp}
                  transition={fadeUpTransition(0.2)}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden />
                  <span>14 dagen gratis • Geen creditcard • Magnetic UI</span>
                </motion.div>
              </div>

              <div className="relative h-[540px]">
                <div className="absolute inset-0 rounded-[34px] bg-gradient-to-br from-indigo-300/35 via-white/30 to-purple-300/40 blur-[110px]" />
                <motion.div
                  className="relative h-full overflow-hidden rounded-[32px] border border-white/40 bg-white/35 p-6 shadow-[0_35px_120px_-60px_rgba(79,70,229,0.55)] backdrop-blur-3xl"
                  {...tiltEffect}
                >
                  <div className="flex items-center justify-between border-b border-white/40 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-500 to-sky-400 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/50">
                        <Sparkles className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Glass preview</p>
                        <p className="text-base font-semibold text-slate-900">Elite Dashboard</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/30 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
                      Indigo beveiliging
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {glassStats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                          <div
                            key={stat.label}
                            className="rounded-2xl border border-white/50 bg-white/45 p-4 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/40`}
                              >
                                <Icon className="h-4 w-4" aria-hidden />
                              </span>
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</div>
                            <p className="mt-1 text-xs font-semibold text-indigo-700">{stat.chip}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="relative overflow-hidden rounded-2xl border border-white/45 bg-white/45 p-5 shadow-[0_22px_80px_-55px_rgba(79,70,229,0.55)]">
                        <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-indigo-400/30 blur-3xl" />
                        <div className="absolute right-0 -bottom-10 h-32 w-40 rounded-full bg-purple-400/20 blur-3xl" />
                        <div className="relative flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Realtime rapportage</p>
                            <p className="text-lg font-semibold text-slate-900">Cashflow & uptime</p>
                          </div>
                          <span className="rounded-full bg-indigo-600/10 px-3 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200/50">
                            Live sync
                          </span>
                        </div>
                        <div className="relative mt-6 grid grid-cols-12 items-end gap-2">
                          {[36, 62, 78, 68, 92, 74, 108, 98, 86, 94, 120, 104].map((height, idx) => (
                            <div key={idx} className="space-y-2">
                              <div
                                className="rounded-xl bg-gradient-to-t from-indigo-600 to-sky-400 shadow-[0_14px_36px_-18px_rgba(79,70,229,0.65)]"
                                style={{ height: `${height}px` }}
                              />
                              <div
                                className="rounded-xl bg-gradient-to-t from-amber-400 to-orange-300 shadow-[0_12px_28px_-18px_rgba(251,191,36,0.6)]"
                                style={{ height: `${Math.max(22, height - 34)}px` }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-500">
                          <span>Omzet</span>
                          <span>Kosten</span>
                          <span>Prognose</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-2xl border border-white/45 bg-white/45 p-4 shadow-[0_18px_60px_-50px_rgba(79,70,229,0.45)]">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">Recente betalingen</p>
                            <ArrowRight className="h-4 w-4 text-slate-500" aria-hidden />
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            {glassPayments.map((invoice) => (
                              <div
                                key={invoice.klant}
                                className="flex items-center justify-between rounded-xl border border-white/50 bg-white/70 px-3 py-2 shadow-sm backdrop-blur"
                              >
                                <div>
                                  <p className="font-semibold text-slate-900">{invoice.klant}</p>
                                  <p className="text-xs text-slate-500">Elite factuur</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-slate-900">{invoice.bedrag}</p>
                                  <span className="text-[11px] font-semibold text-emerald-600">{invoice.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/45 bg-white/40 p-4 shadow-[0_18px_60px_-55px_rgba(15,23,42,0.35)]">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">Flow</p>
                            <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-white">
                              14 dagen gratis
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {glassFlow.map((item) => {
                              const Icon = item.icon;
                              return (
                                <div
                                  key={item.label}
                                  className="flex items-center justify-between rounded-xl border border-white/40 bg-white/60 px-3 py-2 shadow-sm backdrop-blur"
                                >
                                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <span
                                      className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${item.tone}`}
                                    >
                                      <Icon className="h-4 w-4" aria-hidden />
                                    </span>
                                    {item.label}
                                  </div>
                                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sync</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f7f7fb] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Trusted by 500+ ZZP&apos;ers</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Creatives, developers & consultants werken soepeler met ZZP-HUB.
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm">
                <Sparkles className="h-4 w-4 text-indigo-500" aria-hidden />
                <span>Glasheldere premium workflow</span>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {trustLogos.map((logo, idx) => (
                <motion.div
                  key={logo}
                  className="flex items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.25)] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-100"
                  {...staggeredCard(0.04 * idx)}
                >
                  <span className="w-full truncate text-slate-500 mix-blend-multiply filter grayscale">{logo}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Features</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Alles wat je nodig hebt</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Staggered reveals, glasheldere flows en invisible inputs voor je klanten.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={feature.title} className="h-full" {...staggeredCard(0.05 * index)}>
                    <Card className="h-full border-slate-200/70 bg-white/90 shadow-[0_18px_80px_-45px_rgba(15,23,42,0.35)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100">
                      <CardHeader className="space-y-4">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-400 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/30">
                          <Icon className="h-7 w-7" aria-hidden />
                        </div>
                        <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="relative overflow-hidden bg-[#0b0c10] py-24 sm:py-28 text-slate-100">
          <div className="absolute inset-0">
            <div className="absolute left-10 top-8 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-purple-500/20 blur-[140px]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                className="mx-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-200 via-white to-slate-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-900 shadow-[0_10px_50px_-28px_rgba(255,255,255,0.6)]"
                {...fadeUp}
              >
                14 Dagen Gratis
                <Sparkles className="h-4 w-4" aria-hidden />
              </motion.div>
              <motion.h2
                className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl"
                {...fadeUp}
                transition={fadeUpTransition(0.05)}
              >
                €4,99/mnd · All-in-one Elite
              </motion.h2>
              <motion.p
                className="mx-auto mt-4 max-w-2xl text-lg text-slate-300"
                {...fadeUp}
                transition={fadeUpTransition(0.1)}
              >
                Eén plan met alles erin. Inclusief indigo glow beveiliging, audit trails, premium support én 14 dagen gratis
                proberen.
              </motion.p>
            </div>

            <div className="relative mx-auto mt-16 max-w-3xl">
              <div className="absolute inset-6 -z-10 rounded-[36px] bg-indigo-600/30 blur-[100px]" />
              <motion.div
                className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/5 p-8 shadow-[0_35px_120px_-70px_rgba(99,102,241,0.8)] backdrop-blur-2xl"
                {...fadeUp}
                transition={fadeUpTransition(0.15)}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
                    Elite Plan
                  </div>
                  <p className="text-sm text-slate-200">Ultieme focus, premium design, altijd opzegbaar.</p>
                  <div className="mt-4 flex items-end gap-2 text-white">
                    <span className="text-6xl font-semibold tracking-tight">€4,99</span>
                    <span className="mb-2 text-lg font-medium text-slate-200">/ mnd</span>
                  </div>
                </div>
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  {elitePerks.map((perk) => (
                    <div
                      key={perk}
                      className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_50px_-40px_rgba(0,0,0,0.45)]"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-indigo-200" aria-hidden />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm font-semibold text-slate-200">
                  14 dagen gratis proberen. Daarna €4,99 per maand. Geen kleine lettertjes.
                </p>
                <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/register"}
                    className={buttonVariants(
                      "primary",
                      "w-full justify-center bg-white text-indigo-700 px-8 py-3 text-base shadow-[0_20px_70px_-35px_rgba(255,255,255,0.8)] hover:bg-white"
                    )}
                  >
                    {primaryCta}
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                  </Link>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                    <Infinity className="h-4 w-4" aria-hidden />
                    Altijd opzegbaar
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center text-white">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Klaar om te starten?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
                Sluit je aan bij honderden ZZP&apos;ers die al besparen op administratietijd.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className={buttonVariants(
                    "secondary",
                    "text-base px-8 py-3 bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl shadow-indigo-900/20"
                  )}
                >
                  {primaryCta}
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0b0c10] py-12 text-center text-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200">
              <Sparkles className="h-4 w-4" aria-hidden />
              Signature edition
            </div>
            <p className="text-sm font-semibold tracking-tight text-slate-200">Powered by MHM IT</p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <Link href="/privacy" className="transition-colors duration-200 hover:text-white">
                Privacy
              </Link>
              <Link href="/voorwaarden" className="transition-colors duration-200 hover:text-white">
                Voorwaarden
              </Link>
              <Link href="/contact" className="transition-colors duration-200 hover:text-white">
                Contact
              </Link>
            </div>
            <p className="text-xs text-slate-500">© 2024 ZZP-HUB. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
