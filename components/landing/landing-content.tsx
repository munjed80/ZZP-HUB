"use client";

import Link from "next/link";
import { motion, type MotionProps, type TargetAndTransition, type Transition } from "framer-motion";
import { ArrowRight, Calculator, CheckCircle2, FileText, Timer, ShieldCheck, LineChart, Infinity, LifeBuoy, MailCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportForm } from "@/components/support/support-form";
import { AssistantDemo } from "@/components/assistant/assistant-demo";

const BrandZ = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 5h14L5 19h14" />
  </svg>
);

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
  "Midnight Shield beveiliging en 2FA",
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
    accent: "from-[#0a2e50] to-[#4A5568]",
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
  { label: "Rapportage live", icon: BrandZ, tone: "text-[#1e293b] bg-[#1e293b]/10 ring-[#1e293b]/20" },
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
    <div className="min-h-screen bg-gradient-to-b from-[#e2e8f0] via-white to-[#e5e7eb] text-slate-900">
      <header className="sticky top-4 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between rounded-full border border-[#1e293b]/10 bg-white/85 px-4 py-3 shadow-2xl shadow-slate-200/40 backdrop-blur-md">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#1e293b] shadow-[0_10px_40px_-18px_rgba(30,41,59,0.55)] ring-1 ring-[#1e293b]/30">
                <BrandZ className="h-5 w-5 text-white" aria-hidden />
              </div>
              <motion.span
                className="shimmer-text text-xl font-semibold tracking-tight drop-shadow-[0_6px_28px_rgba(30,41,59,0.25)]"
                transition={{ duration: 0.6 }}
              >
                ZZP-HUB
              </motion.span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
              <Link href="#features" className="transition-colors duration-200 hover:text-[#1e293b]">
                Features
              </Link>
              <Link href="#pricing" className="transition-colors duration-200 hover:text-[#1e293b]">
                Prijzen
              </Link>
              <Link href="#assistant" className="transition-colors duration-200 hover:text-[#1e293b]">
                AI assistent
              </Link>
              <Link href="#support" className="transition-colors duration-200 hover:text-[#1e293b]">
                Support
              </Link>
              <Link href="#preview" className="transition-colors duration-200 hover:text-[#1e293b]">
                Preview
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className={buttonVariants(
                      "primary",
                      "shadow-lg shadow-[0_18px_48px_-30px_rgba(10,46,80,0.36)] px-5 py-2.5 text-sm tracking-tight"
                    )}
                  >
                    Naar Dashboard
                  </Link>
                ) : (
                <>
                  <Link href="/login" className={buttonVariants("ghost", "hidden md:inline-flex text-[#1e293b]")}>
                    Inloggen
                  </Link>
                  <Link
                    href="/register"
                    className={buttonVariants(
                      "primary",
                      "shadow-lg shadow-[0_18px_48px_-30px_rgba(10,46,80,0.36)] px-5 py-2.5 text-sm tracking-tight"
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
          className="relative overflow-hidden bg-gradient-to-br from-[#f6f9ff] via-[#eef3f8] to-white pb-24 pt-20 sm:pt-24 lg:pt-28"
        >
          <div className="absolute inset-0">
            <div className="absolute -left-32 top-6 h-72 w-72 rounded-full bg-teal-100/60 blur-3xl" />
            <div className="absolute right-6 top-[-40px] h-96 w-96 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#eef2f6]" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6 text-center lg:text-left">
                <motion.div
                  className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#334155] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#0f172a] shadow-md backdrop-blur sm:mx-0"
                  {...fadeUp}
                >
                  <BrandZ className="h-4 w-4 text-[#1e293b]" aria-hidden />
                  <span>Elite Business Hub 2026</span>
                </motion.div>
              <motion.h1
                className="text-3xl font-semibold leading-[1.05] tracking-[-0.05em] text-slate-900 drop-shadow-[0_10px_28px_rgba(15,23,42,0.28)] sm:text-5xl lg:text-6xl"
                {...fadeUp}
                transition={fadeUpTransition(0.05)}
                style={{
                  backgroundImage: "linear-gradient(125deg,#0f172a 0%,#0ea5e9 45%,#10b981 95%)",
                  backgroundSize: "160% 160%",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                  Slimmer ondernemen met een premium financieel hub voor ZZP&apos;ers.
              </motion.h1>
                <motion.p
                  className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-800 sm:text-xl lg:mx-0"
                  {...fadeUp}
                  transition={fadeUpTransition(0.1)}
                >
                  Beheer je facturen, ritten en agenda met de snelheid van licht. De #1 keuze voor professionele koeriers en ondernemers.
                </motion.p>
                <motion.div
                  className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
                  {...fadeUp}
                  transition={fadeUpTransition(0.15)}
                >
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/register"}
                    className={buttonVariants(
                      "primary",
                      "text-base px-8 py-3 shadow-xl shadow-[0_22px_64px_-36px_rgba(30,41,59,0.45)] transition-all hover:shadow-2xl hover:shadow-[0_26px_72px_-34px_rgba(51,65,85,0.42)]"
                    )}
                  >
                    Start Nu Gratis
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                  </Link>
                  <Link
                    href="#pricing"
                    className={buttonVariants(
                      "secondary",
                      "text-base px-8 py-3 border border-[#334155]/60 bg-white/90 shadow-sm hover:-translate-y-0.5 hover:bg-[#e2e8f0]"
                    )}
                  >
                    Bekijk Demo
                  </Link>
                </motion.div>
                <motion.div
                  className="flex items-center justify-center gap-3 text-sm text-slate-700 lg:justify-start"
                  {...fadeUp}
                  transition={fadeUpTransition(0.2)}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden />
                  <span>14 dagen gratis • Geen creditcard • Premium ervaring</span>
                </motion.div>
              </div>

              <div className="relative h-[540px]">
                <div className="absolute inset-0 rounded-[34px] bg-gradient-to-br from-teal-100/60 via-white to-sky-100/50 blur-[110px]" />
                <motion.div
                  className="relative h-full overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(145deg,#f6f9ff_0%,#e2edf5_55%,#d6e7f4_100%)] bg-[length:200%_200%] p-6 shadow-[0_40px_120px_-70px_rgba(15,23,42,0.3)] ring-1 ring-[#0ea5e9]/15 backdrop-blur-[14px] animate-[metal-shine_8s_linear_infinite]"
                  {...tiltEffect}
                >
                  <div className="flex items-center justify-between border-b border-white/40 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#1f2937] text-white shadow-lg shadow-[0_12px_32px_-18px_rgba(30,41,59,0.6)] ring-1 ring-white/40">
                        <BrandZ className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Glass preview</p>
                        <p className="text-base font-semibold text-slate-900">Elite Dashboard</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/30 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
                      Midnight beveiliging
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
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{stat.label}</p>
                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} text-white shadow-md shadow-[0_12px_32px_-18px_rgba(10,46,80,0.45)] ring-1 ring-white/40`}
                              >
                                <Icon className="h-4 w-4" aria-hidden />
                              </span>
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</div>
                            <p className="mt-1 text-xs font-semibold text-[#1e293b]">{stat.chip}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="relative overflow-hidden rounded-2xl border border-white/45 bg-white/45 p-5 shadow-[0_22px_80px_-55px_rgba(10,46,80,0.45)]">
                        <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-[#1e293b]/20 blur-3xl" />
                        <div className="absolute right-0 -bottom-10 h-32 w-40 rounded-full bg-[#334155]/18 blur-3xl" />
                        <div className="relative flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Realtime rapportage</p>
                            <p className="text-lg font-semibold text-slate-900">Cashflow & uptime</p>
                          </div>
                          <span className="rounded-full bg-[#e2e8f0] px-3 py-1 text-[11px] font-semibold text-[#1e293b] ring-1 ring-[#334155]/50">
                            Live sync
                          </span>
                        </div>
                        <div className="relative mt-6 grid grid-cols-12 items-end gap-2">
                          {[36, 62, 78, 68, 92, 74, 108, 98, 86, 94, 120, 104].map((height, idx) => (
                            <div key={idx} className="space-y-2">
                              <div
                                className="rounded-xl bg-gradient-to-t from-[#0a2e50] to-[#4A5568] shadow-[0_14px_36px_-18px_rgba(10,46,80,0.55)]"
                                style={{ height: `${height}px` }}
                              />
                              <div
                                className="rounded-xl bg-gradient-to-t from-amber-400 to-orange-300 shadow-[0_12px_28px_-18px_rgba(251,191,36,0.6)]"
                                style={{ height: `${Math.max(22, height - 34)}px` }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-700">
                          <span>Omzet</span>
                          <span>Kosten</span>
                          <span>Prognose</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-2xl border border-white/45 bg-white/45 p-4 shadow-[0_18px_60px_-50px_rgba(10,46,80,0.38)]">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">Recente betalingen</p>
                            <ArrowRight className="h-4 w-4 text-slate-700" aria-hidden />
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            {glassPayments.map((invoice) => (
                              <div
                                key={invoice.klant}
                                className="flex items-center justify-between rounded-xl border border-white/50 bg-white/70 px-3 py-2 shadow-sm backdrop-blur"
                              >
                                <div>
                                  <p className="font-semibold text-slate-900">{invoice.klant}</p>
                                  <p className="text-xs text-slate-700">Elite factuur</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-slate-900">{invoice.bedrag}</p>
                                  <span className="text-[11px] font-semibold text-[#10B981]">{invoice.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/45 bg-white/40 p-4 shadow-[0_18px_60px_-55px_rgba(15,23,42,0.35)]">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">Flow</p>
                            <span className="rounded-full bg-[#0a2e50] px-3 py-1 text-[11px] font-semibold text-white shadow-sm shadow-[0_10px_26px_-18px_rgba(10,46,80,0.6)]">
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
                                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Sync</span>
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

        <section className="bg-[#f4f6f8] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Trusted by 500+ ZZP&apos;ers</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Creatives, developers & consultants werken soepeler met ZZP-HUB.
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#334155]/60 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm">
                <BrandZ className="h-4 w-4 text-[#1e293b]" aria-hidden />
                <span>Glasheldere premium workflow</span>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {trustLogos.map((logo, idx) => (
                <motion.div
                  key={logo}
                  className="flex items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-[0_10px_35px_-24px_rgba(10,46,80,0.22)] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[0_18px_40px_-28px_rgba(27,73,101,0.16)]"
                  {...staggeredCard(0.04 * idx)}
                >
                  <span className="w-full truncate text-slate-700 mix-blend-multiply">{logo}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A5568]">Features</p>
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
                    <Card className="h-full border-slate-200/70 bg-white/90 shadow-[0_18px_80px_-45px_rgba(10,46,80,0.32)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[0_24px_90px_-48px_rgba(27,73,101,0.24)]">
                      <CardHeader className="space-y-4">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a2e50] to-[#4A5568] text-white shadow-lg shadow-[0_16px_40px_-24px_rgba(10,46,80,0.5)] ring-1 ring-white/40">
                          <Icon className="h-7 w-7" aria-hidden />
                        </div>
                        <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-700">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="assistant" className="bg-gradient-to-br from-[#f7f9fb] via-white to-[#eef4fb] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700 ring-1 ring-teal-100">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Guided AI
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">AI assistent binnen veilige scope</h2>
                <p className="text-lg text-slate-700">
                  Gericht op ZZP HUB: wat we doen, starten, facturen, BTW, uren en abonnement. Geen open chat, alleen gerichte antwoorden.
                </p>
                <div className="grid gap-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden />
                    Vraag & antwoord per onderwerp, geen vrije chat.
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden />
                    Buiten scope? Automatisch doorverwijzen naar support.
                  </div>
                </div>
              </div>
              <AssistantDemo className="backdrop-blur-md" />
            </div>
          </div>
        </section>

        <section id="support" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-800 ring-1 ring-slate-200">
                  <LifeBuoy className="h-4 w-4" aria-hidden />
                  Support
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Kalm, premium support</h2>
                <p className="text-lg text-slate-700">
                  Bereik ons direct vanuit de landing. Naam, e-mail, onderwerp en bericht zijn genoeg. We bevestigen je aanvraag en antwoorden snel.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 font-semibold">
                      <MailCheck className="h-4 w-4 text-teal-600" aria-hidden />
                      Bevestiging per mail
                    </div>
                    <p className="mt-1 text-slate-600">Heldere status na verzenden, zonder chat-widgets.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden />
                      Focus op product
                    </div>
                    <p className="mt-1 text-slate-600">Facturen, BTW, uren en abonnement zijn onze prioriteit.</p>
                  </div>
                </div>
              </div>
              <SupportForm context="Landing" minimal />
            </div>
          </div>
        </section>

        <section id="pricing" className="relative overflow-hidden bg-gradient-to-br from-[#0a2e50] via-[#0c3d66] to-[#0a2e50] py-24 sm:py-28 text-slate-100">
          <div className="absolute inset-0">
            <div className="absolute left-10 top-8 h-72 w-72 rounded-full bg-[#4A5568]/40 blur-3xl" />
            <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[#0a2e50]/35 blur-[140px]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                className="mx-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#0f172a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white shadow-[0_12px_40px_-18px_rgba(15,23,42,0.55)]"
                {...fadeUp}
              >
                14 Dagen Gratis
                <BrandZ className="h-4 w-4" aria-hidden />
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
                Eén plan met alles erin. Inclusief Midnight Shield beveiliging, audit trails, premium support én 14 dagen gratis
                proberen.
              </motion.p>
            </div>

            <div className="relative mx-auto mt-16 max-w-3xl">
              <div className="absolute inset-6 -z-10 rounded-[36px] bg-[#4A5568]/45 blur-[100px]" />
              <motion.div
                className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/5 p-8 shadow-[0_35px_120px_-70px_rgba(10,46,80,0.65)] backdrop-blur-2xl"
                {...fadeUp}
                transition={fadeUpTransition(0.15)}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e7eef4]">
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
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" aria-hidden />
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
                      "w-full justify-center bg-white text-[#0a2e50] px-8 py-3 text-base shadow-[0_20px_70px_-35px_rgba(255,255,255,0.8)] hover:bg-white"
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

        <section className="bg-gradient-to-r from-[#0a2e50] via-[#4A5568] to-[#0a2e50] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center text-white">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Klaar om te starten?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[#e7eef4]">
                Sluit je aan bij honderden ZZP&apos;ers die al besparen op administratietijd.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/register"}
                    className={buttonVariants(
                      "secondary",
                      "text-base px-8 py-3 bg-white text-[#1e293b] hover:bg-[#e2e8f0] shadow-xl shadow-[0_22px_64px_-40px_rgba(30,41,59,0.35)]"
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
              <BrandZ className="h-4 w-4 text-slate-100" aria-hidden />
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
            <p className="text-xs text-slate-300">© 2024 ZZP-HUB. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
