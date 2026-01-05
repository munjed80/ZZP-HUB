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
    accent: "from-[rgb(var(--brand-primary-active))] to-[rgb(var(--brand-primary-hover))]",
  },
  {
    label: "Openstaand",
    value: "€2.130",
    chip: "3 facturen",
    icon: FileText,
    accent: "from-warning/90 to-warning/70",
  },
  {
    label: "Focus sprint",
    value: "06:24:18",
    chip: "Timer live",
    icon: Timer,
    accent: "from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary-hover))]",
  },
];

const glassPayments = [
  { klant: "Peak Devs", bedrag: "€1.420", status: "Betaald" },
  { klant: "Studio Blink", bedrag: "€980", status: "In review" },
  { klant: "Noord Agency", bedrag: "€760", status: "Betaald" },
];

const glassFlow = [
  { label: "BTW-sync klaar", icon: ShieldCheck, tone: "text-[rgb(var(--brand-on-primary))] bg-[rgb(var(--brand-primary))]/10 ring-[rgb(var(--brand-primary))]/20" },
  { label: "Rapportage live", icon: BrandZ, tone: "text-foreground bg-foreground/10 ring-foreground/15" },
  { label: "Automatische incasso", icon: Calculator, tone: "text-warning-foreground bg-warning/10 ring-warning/30" },
];

const howItWorks = [
  {
    title: "Start & stel profiel in",
    description: "Registreer, vul je bedrijfsprofiel in en voeg je eerste klant toe.",
    icon: ShieldCheck,
  },
  {
    title: "Documenten versturen",
    description: "Maak een offerte of factuur, download de PDF of verstuur direct via e-mail.",
    icon: FileText,
  },
  {
    title: "Inzicht & BTW",
    description: "Bekijk dashboard, BTW-kaarten en omzet/kosten verdeling in één oogopslag.",
    icon: LineChart,
  },
];

const landingFaq = [
  { question: "Kan ik gratis starten?", answer: "Ja, 14 dagen volledig gratis. Daarna €4,99 p/m en maandelijks opzegbaar." },
  { question: "Hoe verstuur ik facturen?", answer: "Maak een factuur en kies Acties → Verstuur via e-mail of Download PDF." },
  { question: "Is mijn data veilig?", answer: "Ja, beveiligde hosting, audit trails en beperkte AI-scope binnen productvragen." },
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
    <div className="min-h-screen bg-gradient-to-b from-[rgb(var(--bg-surface))] via-[rgb(var(--bg-card))] to-[rgb(var(--bg-surface))] text-foreground">
      <header className="sticky top-4 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between rounded-full border border-border bg-card/85 px-4 py-3 shadow-2xl shadow-[0_10px_30px_rgb(var(--text-primary)/0.08)] backdrop-blur-md">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgb(var(--brand-primary-active))] via-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary-hover))] shadow-[0_10px_40px_-18px_rgb(var(--brand-primary)/0.45)] ring-1 ring-[rgb(var(--brand-primary-active))]/30">
                <BrandZ className="h-5 w-5 text-white" aria-hidden />
              </div>
              <motion.span
                className="shimmer-text text-xl font-semibold tracking-tight drop-shadow-[0_6px_28px_rgb(var(--text-primary)/0.25)]"
                transition={{ duration: 0.6 }}
              >
                ZZP-HUB
              </motion.span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
              <Link href="#features" className="transition-colors duration-200 hover:text-foreground">
                Features
              </Link>
              <Link href="#pricing" className="transition-colors duration-200 hover:text-foreground">
                Prijzen
              </Link>
              <Link href="#assistant" className="transition-colors duration-200 hover:text-foreground">
                AI assistent
              </Link>
              <Link href="#support" className="transition-colors duration-200 hover:text-foreground">
                Support
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className={buttonVariants(
                      "primary",
                      "shadow-lg px-5 py-2.5 text-sm tracking-tight"
                    )}
                  >
                    Naar Dashboard
                  </Link>
                ) : (
                <>
                  <Link href="/login" className={buttonVariants("ghost", "hidden md:inline-flex text-foreground")}>
                    Inloggen
                  </Link>
                  <Link
                    href="/register"
                    className={buttonVariants(
                      "primary",
                      "shadow-lg px-5 py-2.5 text-sm tracking-tight"
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
        {/* Hero Section - Redesigned from scratch */}
        <section
          id="hero"
          className="relative min-h-[85vh] overflow-hidden bg-gradient-to-br from-[rgb(var(--brand-primary-active))] via-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary-hover))] pb-20 pt-16 sm:min-h-[90vh] sm:pb-24 sm:pt-20 lg:pt-24"
        >
          {/* Background ambient effects */}
          <div className="absolute inset-0">
            <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-[rgb(var(--brand-primary))]/12 blur-[120px]" />
            <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-[rgb(var(--brand-primary-hover))]/12 blur-[100px]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-[calc(85vh-8rem)] flex-col items-center justify-center text-center sm:min-h-[calc(90vh-10rem)]">
              {/* Main content */}
              <div className="max-w-4xl space-y-8">
                {/* Emotional headline */}
                <motion.h1
                  className="text-4xl font-bold leading-[1.1] tracking-tight text-[rgb(var(--brand-on-primary))] sm:text-5xl lg:text-6xl"
                  {...fadeUp}
                >
                  Jouw financiën onder controle.
                  <br />
                  <span className="bg-gradient-to-r from-[rgb(var(--brand-on-primary))] via-[rgb(var(--brand-on-primary))]/85 to-[rgb(var(--brand-on-primary))] bg-clip-text text-transparent">
                    Simpel. Professioneel.
                  </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                  className="mx-auto max-w-2xl text-lg leading-relaxed text-[rgb(var(--brand-on-primary))]/85 sm:text-xl"
                  {...fadeUp}
                  transition={fadeUpTransition(0.1)}
                >
                  Facturen, BTW-aangifte en uren — alles in één overzichtelijk platform voor ZZP&apos;ers in Nederland.
                </motion.p>

                {/* Primary CTA */}
                <motion.div
                  className="flex flex-col items-center gap-4 pt-2"
                  {...fadeUp}
                  transition={fadeUpTransition(0.15)}
                >
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/register"}
                    className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary-hover))] px-8 py-4 text-base font-semibold text-[rgb(var(--brand-on-primary))] shadow-lg shadow-[0_0_40px_rgb(var(--brand-primary)/0.32)] transition-all duration-300 hover:shadow-[0_0_50px_rgb(var(--brand-primary)/0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-main))]"
                  >
                    <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    Start 14 dagen gratis
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>

                  {/* Trust signals */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                    <div className="flex items-center justify-center gap-2 text-sm text-[rgb(var(--brand-on-primary))]/90">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[rgb(var(--brand-on-primary))]" aria-hidden />
                      <span className="font-medium">14 dagen gratis</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-[rgb(var(--brand-on-primary))]/90">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[rgb(var(--brand-on-primary))]" aria-hidden />
                      <span className="font-medium">Geen creditcard</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-[rgb(var(--brand-on-primary))]/90">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[rgb(var(--brand-on-primary))]" aria-hidden />
                      <span className="font-medium">Voor ZZP&apos;ers in NL</span>
                    </div>
                  </div>
                </motion.div>

                {/* Soft visual hint - Abstract financial flow */}
                <motion.div
                  className="mx-auto mt-12 max-w-3xl"
                  {...fadeUp}
                  transition={fadeUpTransition(0.2)}
                >
                  <div className="relative overflow-hidden rounded-3xl border border-[rgb(var(--brand-on-primary))]/15 bg-[rgb(var(--brand-on-primary))]/5 p-6 backdrop-blur-sm sm:p-8">
                    {/* Subtle glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--brand-primary))]/8 via-transparent to-[rgb(var(--brand-primary-hover))]/8" />
                    
                    <div className="relative grid grid-cols-3 gap-4 sm:gap-6">
                      {/* Financial flow items */}
                      <div className="space-y-3 text-left">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--brand-primary))]/15 backdrop-blur-sm">
                          <FileText className="h-6 w-6 text-[rgb(var(--brand-on-primary))]" aria-hidden />
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-[rgb(var(--brand-on-primary))]">€12.4k</div>
                          <div className="text-sm text-[rgb(var(--brand-on-primary))]/85">Facturen</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-left">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--brand-primary-hover))]/15 backdrop-blur-sm">
                          <Calculator className="h-6 w-6 text-[rgb(var(--brand-on-primary))]" aria-hidden />
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-[rgb(var(--brand-on-primary))]">€2.6k</div>
                          <div className="text-sm text-[rgb(var(--brand-on-primary))]/85">BTW klaar</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-left">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20 backdrop-blur-sm">
                          <Timer className="h-6 w-6 text-[rgb(var(--brand-on-primary))]" aria-hidden />
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-[rgb(var(--brand-on-primary))]">1,180</div>
                          <div className="text-sm text-[rgb(var(--brand-on-primary))]/85">Uren</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[rgb(var(--bg-surface))] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trusted by 500+ ZZP&apos;ers</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  Creatives, developers & consultants werken soepeler met ZZP-HUB.
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-2 text-sm text-muted-foreground shadow-sm">
                <BrandZ className="h-4 w-4 text-foreground" aria-hidden />
                <span>Glasheldere premium workflow</span>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {trustLogos.map((logo, idx) => (
                <motion.div
                  key={logo}
                  className="flex items-center justify-center rounded-xl border border-border bg-card/80 px-4 py-3 text-center text-sm font-semibold text-muted-foreground shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  {...staggeredCard(0.04 * idx)}
                >
                  <span className="w-full truncate text-muted-foreground mix-blend-multiply">{logo}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-card py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Features</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Alles wat je nodig hebt</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Staggered reveals, glasheldere flows en invisible inputs voor je klanten.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={feature.title} className="h-full" {...staggeredCard(0.05 * index)}>
                    <Card className="h-full border-border bg-card/90 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <CardHeader className="space-y-4">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgb(var(--brand-primary-active))] to-[rgb(var(--brand-primary-hover))] text-[rgb(var(--brand-on-primary))] shadow-md ring-1 ring-[rgb(var(--brand-primary))]/30">
                          <Icon className="h-7 w-7" aria-hidden />
                        </div>
                        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[rgb(var(--bg-surface))] via-[rgb(var(--bg-card))] to-[rgb(var(--bg-surface))] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Hoe het werkt</p>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  In drie stappen live met facturen, offertes en BTW
                </h2>
                <p className="text-lg text-muted-foreground">
                  Geen overbodige modules. Alleen wat je nodig hebt om documenten te versturen en overzicht te houden.
                </p>
              </div>
              <div className="grid gap-4">
                {howItWorks.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-md"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--bg-surface))] text-foreground ring-1 ring-border">
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Stap {idx + 1}</p>
                        <p className="text-base font-semibold text-foreground">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="assistant" className="bg-gradient-to-br from-[rgb(var(--bg-surface))] via-[rgb(var(--bg-card))] to-[rgb(var(--bg-surface))] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary ring-1 ring-primary/25">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Guided AI
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">AI assistent binnen veilige scope</h2>
                <p className="text-lg text-muted-foreground">
                  Gericht op ZZP HUB: wat we doen, starten, facturen, BTW, uren en abonnement. Geen open chat, alleen gerichte antwoorden.
                </p>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 rounded-lg bg-card/80 px-3 py-2 ring-1 ring-border">
                    <CheckCircle2 className="h-4 w-4 text-[rgb(var(--brand-primary))]" aria-hidden />
                    Vraag & antwoord per onderwerp, geen vrije chat.
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-card/80 px-3 py-2 ring-1 ring-border">
                    <CheckCircle2 className="h-4 w-4 text-[rgb(var(--brand-primary))]" aria-hidden />
                    Buiten scope? Automatisch doorverwijzen naar support.
                  </div>
                </div>
              </div>
              <AssistantDemo className="backdrop-blur-md" />
            </div>
          </div>
        </section>

        <section className="bg-card py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">FAQ</p>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Snel antwoord op de belangrijkste vragen
                </h2>
                <p className="text-lg text-muted-foreground">
                  Gericht op onboarding, betalingen en beveiliging. Alles binnen het product en zonder wachttijd.
                </p>
              </div>
              <div className="grid gap-3">
                {landingFaq.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-2xl border border-border bg-[rgb(var(--bg-surface))] p-4 shadow-sm"
                  >
                    <p className="text-base font-semibold text-foreground">{item.question}</p>
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="support" className="bg-card py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--bg-surface))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-foreground ring-1 ring-border">
                  <LifeBuoy className="h-4 w-4" aria-hidden />
                  Support
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Kalm, premium support</h2>
                <p className="text-lg text-muted-foreground">
                  Bereik ons direct vanuit de landing. Naam, e-mail, onderwerp en bericht zijn genoeg. We bevestigen je aanvraag en antwoorden snel.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-[rgb(var(--bg-surface))] px-4 py-3 text-sm text-foreground shadow-sm">
                    <div className="flex items-center gap-2 font-semibold">
                      <MailCheck className="h-4 w-4 text-[rgb(var(--brand-primary))]" aria-hidden />
                      Bevestiging per mail
                    </div>
                    <p className="mt-1 text-muted-foreground">Heldere status na verzenden, zonder chat-widgets.</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-[rgb(var(--bg-surface))] px-4 py-3 text-sm text-foreground shadow-sm">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck className="h-4 w-4 text-[rgb(var(--brand-primary))]" aria-hidden />
                      Focus op product
                    </div>
                    <p className="mt-1 text-muted-foreground">Facturen, BTW, uren en abonnement zijn onze prioriteit.</p>
                  </div>
                </div>
              </div>
              <SupportForm context="Landing" minimal />
            </div>
          </div>
        </section>

        <section id="pricing" className="relative overflow-hidden bg-gradient-to-br from-[rgb(var(--brand-primary-active))] via-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary-hover))] py-24 sm:py-28 text-[rgb(var(--brand-on-primary))]">
          <div className="absolute inset-0">
            <div className="absolute left-10 top-8 h-72 w-72 rounded-full bg-[rgb(var(--brand-primary-active))]/30 blur-3xl" />
            <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[rgb(var(--brand-primary-hover))]/35 blur-[140px]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                className="mx-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[rgb(var(--brand-primary-active))] via-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary-hover))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--brand-on-primary))] shadow-[0_12px_40px_-18px_rgb(var(--brand-on-primary)/0.35)]"
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
                className="mx-auto mt-4 max-w-2xl text-lg text-[rgb(var(--brand-on-primary))]/85"
                {...fadeUp}
                transition={fadeUpTransition(0.1)}
              >
                Eén plan met alles erin. Inclusief Midnight Shield beveiliging, audit trails, premium support én 14 dagen gratis
                proberen.
              </motion.p>
            </div>

            <div className="relative mx-auto mt-16 max-w-3xl">
              <div className="absolute inset-6 -z-10 rounded-[36px] bg-[rgb(var(--brand-primary-active))]/25 blur-[100px]" />
              <motion.div
                className="relative overflow-hidden rounded-[32px] border border-[rgb(var(--brand-on-primary))]/15 bg-[rgb(var(--brand-on-primary))]/5 p-8 shadow-[0_35px_120px_-70px_rgb(var(--brand-on-primary)/0.55)] backdrop-blur-2xl"
                {...fadeUp}
                transition={fadeUpTransition(0.15)}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--brand-on-primary))]/25 bg-[rgb(var(--brand-on-primary))]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-on-primary))]">
                    Elite Plan
                  </div>
                  <p className="text-sm text-[rgb(var(--brand-on-primary))]/85">Ultieme focus, premium design, altijd opzegbaar.</p>
                  <div className="mt-4 flex items-end gap-2 text-[rgb(var(--brand-on-primary))]">
                    <span className="text-6xl font-semibold tracking-tight">€4,99</span>
                    <span className="mb-2 text-lg font-medium text-[rgb(var(--brand-on-primary))]/80">/ mnd</span>
                  </div>
                </div>
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  {elitePerks.map((perk) => (
                    <div
                      key={perk}
                      className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--brand-on-primary))]/15 bg-[rgb(var(--brand-on-primary))]/10 px-4 py-3 text-sm text-[rgb(var(--brand-on-primary))] shadow-[0_18px_50px_-40px_rgb(var(--brand-on-primary)/0.45)]"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-[rgb(var(--brand-on-primary))]" aria-hidden />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm font-semibold text-[rgb(var(--brand-on-primary))]/85">
                  14 dagen gratis proberen. Daarna €4,99 per maand. Geen kleine lettertjes.
                </p>
                <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/register"}
                    className={buttonVariants(
                      "primary",
                      "w-full justify-center bg-[rgb(var(--brand-on-primary))] text-[rgb(var(--brand-primary-active))] px-8 py-3 text-base shadow-[0_20px_70px_-35px_rgb(var(--brand-on-primary)/0.4)] hover:bg-[rgb(var(--brand-on-primary))]"
                    )}
                  >
                    {primaryCta}
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                  </Link>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[rgb(var(--brand-on-primary))]/80">
                    <Infinity className="h-4 w-4" aria-hidden />
                    Altijd opzegbaar
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-[rgb(var(--brand-primary-active))] via-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary-hover))] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center text-[rgb(var(--brand-on-primary))]">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Klaar om te starten?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[rgb(var(--brand-on-primary))]/85">
                Sluit je aan bij honderden ZZP&apos;ers die al besparen op administratietijd.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/register"}
                    className={buttonVariants(
                      "secondary",
                      "text-base px-8 py-3 bg-[rgb(var(--brand-on-primary))] text-[rgb(var(--brand-primary-active))] hover:bg-[rgb(var(--brand-on-primary))]"
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

      <footer className="bg-[rgb(var(--bg-main))] py-12 text-center text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-[rgb(var(--bg-surface))] px-3 py-1 text-xs uppercase tracking-[0.2em] text-foreground">
              <BrandZ className="h-4 w-4 text-foreground" aria-hidden />
              Signature edition
            </div>
            <p className="text-sm font-semibold tracking-tight text-foreground">Powered by MHM IT</p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="transition-colors duration-200 hover:text-foreground">
                Privacy
              </Link>
              <Link href="/voorwaarden" className="transition-colors duration-200 hover:text-foreground">
                Voorwaarden
              </Link>
              <Link href="/contact" className="transition-colors duration-200 hover:text-foreground">
                Contact
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 ZZP-HUB. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
