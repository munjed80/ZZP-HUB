"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  FileText,
  Timer,
  Sparkles,
  Play,
  ShieldCheck,
  LineChart,
} from "lucide-react";
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

const pricing = [
  {
    name: "Starter",
    price: "Gratis",
    detail: "Voor starters",
    features: [
      "Tot 10 facturen per maand",
      "Minimalistische urenregistratie",
      "BTW-overzicht en PDF-export",
      "E-mail support",
    ],
  },
  {
    name: "Pro",
    price: "€15",
    period: "/maand",
    detail: "Meest populair",
    featured: true,
    features: [
      "Onbeperkt facturen",
      "Geavanceerde rapportages",
      "Automatische BTW-aangifte",
      "Prioriteit support",
      "Kostenbeheer",
      "Export naar boekhouder",
    ],
  },
];

const trustLogos = ["Delta Studio", "Noord Agency", "Kracht Consulting", "Studio Blink", "Peak Devs", "Atelier 6"];

const dashboardStats = [
  {
    label: "Omzet",
    value: "€12.4k",
    change: "+18%",
    accent: "from-indigo-500 to-indigo-400",
    changeClass: "text-emerald-600 bg-emerald-50",
  },
  {
    label: "Kosten",
    value: "€3.1k",
    change: "-4%",
    accent: "from-amber-500 to-orange-400",
    changeClass: "text-rose-600 bg-rose-50",
  },
  {
    label: "Winst",
    value: "€9.3k",
    change: "+11%",
    accent: "from-emerald-500 to-teal-400",
    changeClass: "text-emerald-600 bg-emerald-50",
  },
];

const recentInvoices = [
  {
    name: "Factuur #1043",
    client: "Delta Studio",
    amount: "€1.250",
    status: "Betaald",
    statusClass: "text-emerald-700 bg-emerald-50",
  },
  {
    name: "Factuur #1044",
    client: "Noord Agency",
    amount: "€980",
    status: "Open",
    statusClass: "text-amber-700 bg-amber-50",
  },
  {
    name: "Factuur #1045",
    client: "Peak Devs",
    amount: "€1.420",
    status: "Verzonden",
    statusClass: "text-indigo-700 bg-indigo-50",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggeredCard = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay } },
  viewport: { once: true, amount: 0.2 },
});

export function LandingContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  const primaryCta = isLoggedIn ? "Naar Dashboard" : "Gratis starten";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/50">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <span className="text-xl">ZZP-HUB</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link href="#features" className="transition-colors duration-200 hover:text-indigo-600">
              Features
            </Link>
            <Link href="#pricing" className="transition-colors duration-200 hover:text-indigo-600">
              Prijzen
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className={buttonVariants(
                  "primary",
                  "shadow-lg shadow-indigo-500/25 px-5 py-2.5 text-sm tracking-tight hover:-translate-y-0.5 transition-transform"
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
                    "shadow-lg shadow-indigo-500/25 px-5 py-2.5 text-sm tracking-tight hover:-translate-y-0.5 transition-transform"
                  )}
                >
                  Gratis starten
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20">
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FAFAFA] to-[#f3f4ff] pb-20 pt-16 sm:pt-24 lg:pt-32">
          <div className="absolute inset-0">
            <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
            <div className="absolute right-10 top-[-60px] h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#FAFAFA]" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700 shadow-sm backdrop-blur"
                {...fadeUp}
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                <span>Premium admin platform</span>
              </motion.div>
              <motion.h1
                className="mb-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl"
                {...fadeUp}
                transition={{ ...fadeUp.animate.transition, delay: 0.05 }}
              >
                De slimste administratie tool voor{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                  Nederlandse ZZP&apos;ers
                </span>
              </motion.h1>
              <motion.p
                className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl"
                {...fadeUp}
                transition={{ ...fadeUp.animate.transition, delay: 0.1 }}
              >
                Een luxueuze, glasheldere ervaring om facturen, uren en BTW te automatiseren. Ontworpen
                voor focus, rust en groei.
              </motion.p>
              <motion.div
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
                {...fadeUp}
                transition={{ ...fadeUp.animate.transition, delay: 0.15 }}
              >
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className={buttonVariants(
                    "primary",
                    "text-base px-8 py-3 shadow-xl shadow-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                  )}
                >
                  {primaryCta}
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                </Link>
                <button
                  className={buttonVariants(
                    "secondary",
                    "text-base px-8 py-3 group border border-slate-200/80 shadow-sm hover:-translate-y-0.5 transition-all"
                  )}
                >
                  <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" aria-hidden />
                  Bekijk demo
                </button>
              </motion.div>
              <motion.div
                className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-600"
                {...fadeUp}
                transition={{ ...fadeUp.animate.transition, delay: 0.2 }}
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden />
                <span>Geen creditcard nodig • 14 dagen gratis proberen</span>
              </motion.div>
            </div>

            <div className="mt-16 sm:mt-20">
              <motion.div
                className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_30px_100px_-40px_rgba(79,70,229,0.5)] backdrop-blur-3xl ring-1 ring-indigo-100/60"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-indigo-100/60" aria-hidden />
                <div className="relative flex items-center gap-2 border-b border-white/70 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-medium text-slate-500">Dashboard Preview</span>
                </div>
                <motion.div
                  className="relative bg-gradient-to-b from-white/90 to-indigo-50/60 p-4 sm:p-6 lg:p-8"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="absolute -left-6 -top-8 h-24 w-24 rounded-full bg-indigo-200/50 blur-3xl" aria-hidden />
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-indigo-300/30 blur-3xl" aria-hidden />
                  <div className="relative grid gap-4 sm:gap-6 lg:grid-cols-[240px_1fr]">
                    <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/60 p-4 shadow-lg shadow-indigo-900/10 backdrop-blur-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/40">
                            <Sparkles className="h-5 w-5" aria-hidden />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Saldo</p>
                            <p className="text-lg font-semibold text-slate-900">€24.320</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">+6.3%</span>
                      </div>
                      <div className="space-y-2">
                        {["Dashboard", "Facturen", "Rapportage", "Kosten"].map((item) => (
                          <div
                            key={item}
                            className="flex items-center justify-between rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-indigo-900/5 backdrop-blur"
                          >
                            <span>{item}</span>
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]" />
                              <ArrowRight className="h-4 w-4 text-slate-500" aria-hidden />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 p-4 text-white shadow-lg shadow-indigo-900/30">
                        <div className="flex items-center justify-between text-sm text-white/80">
                          <span>Cashflow</span>
                          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">+12%</span>
                        </div>
                        <div className="mt-4 grid grid-cols-8 items-end gap-1">
                          {[35, 48, 60, 42, 70, 64, 80, 72].map((height, idx) => (
                            <div
                              key={idx}
                              className="rounded-full bg-white/70"
                              style={{ height: `${height}px` }}
                              aria-hidden
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-white/80">
                          <span>Jan</span>
                          <span>Mei</span>
                          <span>Aug</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {dashboardStats.map((stat) => (
                          <div
                            key={stat.label}
                            className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-lg shadow-indigo-900/10 backdrop-blur-xl"
                          >
                            <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${stat.changeClass}`}>
                              {stat.change}
                            </div>
                            <p className="mt-3 text-sm font-medium text-slate-500">{stat.label}</p>
                            <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                            <div className={`mt-3 h-2 rounded-full bg-gradient-to-r ${stat.accent} shadow-inner`} aria-hidden />
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-lg shadow-indigo-900/10 backdrop-blur-xl">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-700">Omzet & Kosten</p>
                            <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-600">Live</span>
                          </div>
                          <div className="mt-4 grid grid-cols-6 items-end gap-2">
                            {[65, 52, 74, 68, 80, 72].map((height, idx) => (
                              <div key={idx} className="space-y-2">
                                <div className="h-1.5 rounded-full bg-slate-200/80" />
                                <div
                                  className="rounded-xl bg-gradient-to-t from-indigo-500 to-indigo-400 shadow-[0_10px_25px_-12px_rgba(79,70,229,0.7)]"
                                  style={{ height: `${height}px` }}
                                  aria-hidden
                                />
                                <div
                                  className="rounded-xl bg-gradient-to-t from-amber-400 to-orange-300 shadow-[0_10px_25px_-12px_rgba(251,191,36,0.7)]"
                                  style={{ height: `${Math.max(30, height - 22)}px` }}
                                  aria-hidden
                                />
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                              <span>Omzet</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                              <span>Kosten</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-lg shadow-indigo-900/10 backdrop-blur-xl">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-700">Recente facturen</p>
                            <Link href="/dashboard" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                              Bekijk alles
                            </Link>
                          </div>
                          <div className="mt-4 space-y-3">
                            {recentInvoices.map((invoice) => (
                              <div
                                key={invoice.name}
                                className="flex items-center justify-between rounded-xl border border-white/60 bg-white/80 px-3 py-2 shadow-sm shadow-indigo-900/5 backdrop-blur"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{invoice.name}</p>
                                  <p className="text-xs text-slate-500">{invoice.client}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-slate-800">{invoice.amount}</span>
                                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${invoice.statusClass}`}>
                                    {invoice.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="bg-[#FAFAFA] py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Trusted by 500+ ZZP&apos;ers
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Creatives, developers & consultants werken soepeler met ZZP-HUB.
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-sm">
                <Sparkles className="h-4 w-4 text-indigo-500" aria-hidden />
                <span>Sneller betaald, minder frictie</span>
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

        <section id="features" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Features</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Alles wat je nodig hebt
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Bespaar tijd, krijg inzicht en lever een premium ervaring richting je klanten.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className="h-full"
                    {...staggeredCard(0.05 * index)}
                  >
                    <Card className="h-full border-slate-200/70 bg-white/90 shadow-[0_18px_80px_-45px_rgba(15,23,42,0.35)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100">
                      <CardHeader className="space-y-4">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-400 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/30">
                          <Icon className="h-7 w-7" aria-hidden />
                        </div>
                        <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
                          {feature.title}
                        </CardTitle>
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

        <section id="pricing" className="bg-[#FAFAFA] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Prijzen</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Transparante pakketten
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Kies het plan dat bij jouw groei past. Altijd opzegbaar.
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
              {pricing.map((plan, index) => (
                <motion.div key={plan.name} {...staggeredCard(0.05 * index)}>
                  <Card
                    className={`relative overflow-hidden border bg-white/95 shadow-[0_18px_80px_-48px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                      plan.featured
                        ? "border-indigo-600/80 ring-4 ring-indigo-100/70"
                        : "border-slate-200/80"
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-1 text-xs font-semibold uppercase text-white shadow-md shadow-indigo-500/40">
                        {plan.detail}
                      </div>
                    )}
                    <CardHeader className="pb-8 pt-10">
                      <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        {plan.name}
                      </CardTitle>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-5xl font-semibold tracking-tight text-slate-900">{plan.price}</span>
                        {plan.period && <span className="text-lg font-medium text-slate-600">{plan.period}</span>}
                      </div>
                      {!plan.featured && <p className="mt-2 text-sm text-slate-600">{plan.detail}</p>}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                            <span className="text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={isLoggedIn ? "/dashboard" : "/register"}
                        className={buttonVariants(
                          plan.featured ? "primary" : "secondary",
                          `w-full justify-center text-base py-3 transition-transform hover:-translate-y-0.5 ${
                            plan.featured ? "shadow-lg shadow-indigo-500/30" : "border border-slate-200/80"
                          }`
                        )}
                      >
                        {isLoggedIn ? "Naar Dashboard" : `Start met ${plan.name}`}
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
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
                    "text-base px-8 py-3 bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl shadow-indigo-900/20 hover:-translate-y-0.5 transition-transform"
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

      <footer className="border-t border-slate-200/70 bg-white/90 py-12 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Sparkles className="h-5 w-5 text-indigo-600" aria-hidden />
              <span>ZZP-HUB</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <Link href="/privacy" className="transition-colors duration-200 hover:text-indigo-600">
                Privacy
              </Link>
              <Link href="/voorwaarden" className="transition-colors duration-200 hover:text-indigo-600">
                Voorwaarden
              </Link>
              <Link href="/contact" className="transition-colors duration-200 hover:text-indigo-600">
                Contact
              </Link>
            </div>
            <p className="text-sm text-slate-600">© 2024 ZZP-HUB. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
