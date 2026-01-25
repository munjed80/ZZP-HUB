"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { motion, type MotionProps, type TargetAndTransition, type Transition } from "framer-motion";
import { ArrowRight, Calculator, CheckCircle2, FileText, Timer, ShieldCheck, LineChart, Infinity, LifeBuoy, MailCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportForm } from "@/components/support/support-form";
import { cn } from "@/lib/utils";

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

const landingCtaBase = [
  "group relative isolate inline-flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-xl",
  // Border: green with slight transparency
  "border border-emerald-800/35",
  // Gradient: natural greens
  "bg-gradient-to-br from-emerald-700 to-emerald-600",
  // Text: near-white for AA contrast
  "text-sm font-semibold leading-tight text-lime-50",
  // Shadow: soft green (not heavy)
  "shadow-[0_12px_32px_-18px_rgba(34,197,94,0.6)]",
  // Transitions
  "transition-[transform,box-shadow,filter] duration-300 ease-out",
  // Hover: slightly brighter gradient + stronger green glow
  "hover:from-emerald-600 hover:to-emerald-700",
  "hover:shadow-[0_16px_40px_-16px_rgba(34,197,94,0.85)]",
  "hover:brightness-110",
  // Focus: strong emerald outline ring for accessibility
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
  // Active: slight press-down transform
  "active:scale-[0.98] active:shadow-[0_8px_24px_-14px_rgba(34,197,94,0.7)]",
].join(" ");
const landingCtaDefaultPadding = "px-5 py-3";

// Glow effect: green radial gradient
const landingCtaGlow =
  `pointer-events-none absolute -inset-6 rounded-[18px] bg-[radial-gradient(circle_at_30%_22%,rgba(34,197,94,0.35),transparent_50%)] blur-[24px] opacity-60 transition duration-500 ease-out group-hover:scale-110 group-hover:opacity-90 group-active:opacity-50`;

// Sheen effect: subtle green spark on hover
const landingCtaSheen =
  `pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_70%_30%,rgba(34,197,94,0.18),transparent_45%)] opacity-0 transition duration-500 ease-out group-hover:opacity-100`;

// Highlight: subtle white gradient for glossy look
const landingCtaHighlight =
  "pointer-events-none absolute inset-[1px] rounded-[11px] bg-[linear-gradient(180deg,rgba(255,255,255,0.25),rgba(255,255,255,0.08)_50%,rgba(255,255,255,0))] opacity-60 mix-blend-overlay";

// Ring: emerald border with enhanced hover state
const landingCtaRing =
  "pointer-events-none absolute inset-0 rounded-xl ring-1 ring-emerald-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition duration-300 ease-out group-hover:ring-emerald-400/50 group-active:ring-emerald-400/25";

type LandingCtaButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  paddingClass?: string;
};

// Landing-only CTA styling to avoid impacting shared dashboard buttons.
function LandingCtaButton({ href, children, className = "", paddingClass }: LandingCtaButtonProps) {
  return (
    <Link href={href} className={cn(landingCtaBase, paddingClass ?? landingCtaDefaultPadding, className)}>
      <span className={landingCtaGlow} aria-hidden="true" />
      <span className={landingCtaSheen} aria-hidden="true" />
      <span className={landingCtaHighlight} aria-hidden="true" />
      <span className={landingCtaRing} aria-hidden="true" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Link>
  );
}

export function LandingContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  const primaryCta = isLoggedIn ? "Naar Dashboard" : "Gratis starten";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f0f2] via-white to-[#f0f4f8] text-[var(--foreground)]">
      <header className="sticky top-6 z-50 text-[rgb(var(--brand-on-primary))]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="flex items-center justify-between rounded-full border border-[rgb(var(--brand-on-primary))/0.15] bg-white/80 px-5 py-3.5 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_12px_48px_-16px_rgba(15,23,42,0.18)]"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgb(var(--brand-primary)),rgb(var(--brand-primary-hover)))] shadow-[0_8px_24px_-8px_rgba(var(--brand-primary),0.45)] ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_12px_32px_-8px_rgba(var(--brand-primary),0.6)]">
                <BrandZ className="h-5 w-5 text-white transition-transform duration-300 group-hover:rotate-12" aria-hidden />
              </div>
              <span
                className="text-xl font-bold tracking-tight text-slate-800 transition-colors duration-300 group-hover:text-slate-900"
              >
                ZZP-HUB
              </span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
              <Link href="#features" className="relative transition-colors duration-300 hover:text-slate-900 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-emerald-500 after:to-teal-500 after:transition-all after:duration-300 hover:after:w-full">
                Features
              </Link>
              <Link href="#pricing" className="relative transition-colors duration-300 hover:text-slate-900 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-emerald-500 after:to-teal-500 after:transition-all after:duration-300 hover:after:w-full">
                Prijzen
              </Link>
              <Link href="#assistant" className="relative transition-colors duration-300 hover:text-slate-900 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-emerald-500 after:to-teal-500 after:transition-all after:duration-300 hover:after:w-full">
                AI assistent
              </Link>
              <Link href="#support" className="relative transition-colors duration-300 hover:text-slate-900 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-emerald-500 after:to-teal-500 after:transition-all after:duration-300 hover:after:w-full">
                Support
              </Link>
            </nav>
            {/* "Naar Dashboard" button routing logic:
                - Unauthenticated users → /login (must log in first)
                - Authenticated users → /dashboard (middleware handles onboarding redirects if needed) */}
            <div className="flex items-center gap-3">
              <LandingCtaButton href={isLoggedIn ? "/dashboard" : "/login"} paddingClass="px-6 py-2.5" className="text-sm tracking-tight">
                Naar Dashboard
              </LandingCtaButton>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="pt-20 sm:pt-24">
        {/* Hero Section - Enhanced with sophisticated depth */}
        <section
          id="hero"
          className="relative min-h-[90vh] overflow-hidden bg-gradient-to-br from-[#0a3d3d] via-[#0f5656] to-[#0d7a8c] pb-24 pt-20 sm:min-h-[95vh] sm:pb-32 sm:pt-24 lg:pt-28"
        >
          {/* Enhanced background with multiple layers */}
          <div className="absolute inset-0">
            <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-emerald-400/8 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-teal-300/6 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] rounded-full bg-cyan-400/5 blur-[100px]" />
            {/* Subtle grid pattern overlay for depth */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-[calc(90vh-10rem)] flex-col items-center justify-center text-center sm:min-h-[calc(95vh-12rem)]">
              {/* Main content */}
              <div className="max-w-5xl space-y-10">
                {/* Elegant badge */}
                <motion.div
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-100 shadow-[0_8px_32px_-12px_rgba(16,185,129,0.3)] backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden />
                  Premium Platform voor ZZP&apos;ers
                </motion.div>

                {/* Enhanced headline with better typography */}
                <motion.h1
                  className="text-5xl font-bold leading-[1.08] tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl"
                  {...fadeUp}
                >
                  Jouw financiën onder controle.
                  <br />
                  <span className="bg-gradient-to-r from-emerald-200 via-teal-100 to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(16,185,129,0.25)]">
                    Simpel. Professioneel.
                  </span>
                </motion.h1>

                {/* Refined subheadline */}
                <motion.p
                  className="mx-auto max-w-2xl text-xl leading-relaxed text-teal-50/90 sm:text-2xl sm:leading-relaxed"
                  {...fadeUp}
                  transition={fadeUpTransition(0.1)}
                >
                  Facturen, BTW-aangifte en uren — alles in één overzichtelijk platform voor ZZP&apos;ers in Nederland.
                </motion.p>

                {/* Enhanced Primary CTA */}
                <motion.div
                  className="flex flex-col items-center gap-6 pt-4"
                  {...fadeUp}
                  transition={fadeUpTransition(0.15)}
                >
                  <LandingCtaButton
                    href={isLoggedIn ? "/dashboard" : "/register"}
                    paddingClass="px-10 py-5"
                    className="text-lg shadow-[0_20px_60px_-20px_rgba(16,185,129,0.4)] hover:shadow-[0_24px_80px_-24px_rgba(16,185,129,0.6)]"
                  >
                    Start 14 dagen gratis
                    <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </LandingCtaButton>

                  {/* Enhanced trust signals */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                    <div className="flex items-center justify-center gap-2.5 text-sm font-medium text-teal-100/90">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-300" aria-hidden />
                      <span>14 dagen gratis</span>
                    </div>
                    <div className="flex items-center justify-center gap-2.5 text-sm font-medium text-teal-100/90">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-300" aria-hidden />
                      <span>Geen creditcard</span>
                    </div>
                    <div className="flex items-center justify-center gap-2.5 text-sm font-medium text-teal-100/90">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-300" aria-hidden />
                      <span>Voor ZZP&apos;ers in NL</span>
                    </div>
                  </div>
                </motion.div>

                {/* Enhanced visual showcase with sophisticated depth */}
                <motion.div
                  className="mx-auto mt-16 max-w-4xl"
                  {...fadeUp}
                  transition={fadeUpTransition(0.2)}
                >
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-10">
                    {/* Sophisticated gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-teal-500/8" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)]" />
                    
                    <div className="relative grid grid-cols-3 gap-6 sm:gap-8">
                      {/* Financial flow items with enhanced styling */}
                      <motion.div 
                        className="space-y-4 text-left"
                        whileHover={{ y: -4, transition: { duration: 0.3 } }}
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-sm ring-1 ring-white/10 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.3)]">
                          <FileText className="h-7 w-7 text-emerald-200" aria-hidden />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-white">€12.4k</div>
                          <div className="text-sm font-medium text-teal-200/80">Facturen</div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="space-y-4 text-left"
                        whileHover={{ y: -4, transition: { duration: 0.3 } }}
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 backdrop-blur-sm ring-1 ring-white/10 shadow-[0_8px_24px_-8px_rgba(20,184,166,0.3)]">
                          <Calculator className="h-7 w-7 text-teal-200" aria-hidden />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-white">€2.6k</div>
                          <div className="text-sm font-medium text-teal-200/80">BTW klaar</div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="space-y-4 text-left"
                        whileHover={{ y: -4, transition: { duration: 0.3 } }}
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur-sm ring-1 ring-white/10 shadow-[0_8px_24px_-8px_rgba(245,158,11,0.3)]">
                          <Timer className="h-7 w-7 text-amber-200" aria-hidden />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-white">1,180</div>
                          <div className="text-sm font-medium text-teal-200/80">Uren</div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-[#f8fafa] to-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Trusted by 500+ ZZP&apos;ers</p>
                <h3 className="max-w-xl text-3xl font-bold tracking-tight text-slate-900">
                  Creatives, developers & consultants werken soepeler met ZZP-HUB.
                </h3>
              </div>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2.5 text-sm font-medium text-emerald-900 shadow-sm">
                <BrandZ className="h-4 w-4 text-emerald-700" aria-hidden />
                <span>Premium workflow</span>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {trustLogos.map((logo, idx) => (
                <motion.div
                  key={logo}
                  className="group flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-center text-sm font-semibold text-slate-700 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 hover:border-emerald-200/60 hover:shadow-[0_12px_40px_-12px_rgba(16,185,129,0.15)]"
                  {...staggeredCard(0.05 * idx)}
                >
                  <span className="w-full truncate text-slate-700 transition-colors duration-300 group-hover:text-emerald-700">{logo}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="relative overflow-hidden bg-white py-28 sm:py-32">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.03),transparent_50%)]" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.p 
                className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600"
                {...fadeUp}
              >
                Features
              </motion.p>
              <motion.h2 
                className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
                {...fadeUp}
                transition={fadeUpTransition(0.05)}
              >
                Alles wat je nodig hebt
              </motion.h2>
              <motion.p 
                className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600"
                {...fadeUp}
                transition={fadeUpTransition(0.1)}
              >
                Premium features voor een professionele workflow, met focus op gebruiksgemak en efficiency.
              </motion.p>
            </div>

            <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={feature.title} className="group h-full" {...staggeredCard(0.06 * index)}>
                    <Card className="h-full border-slate-200/60 bg-white shadow-[0_8px_40px_-16px_rgba(15,23,42,0.1)] transition-all duration-500 hover:-translate-y-2 hover:border-emerald-200/60 hover:shadow-[0_20px_60px_-20px_rgba(16,185,129,0.15)]">
                      <CardHeader className="space-y-5">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-white/20 transition-transform duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-emerald-500/30">
                          <Icon className="h-8 w-8" aria-hidden />
                        </div>
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-900">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="leading-relaxed text-slate-600">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[#f8fafb] via-white to-[#f4f8fa] py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
              <div className="space-y-6">
                <motion.p 
                  className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600"
                  {...fadeUp}
                >
                  Hoe het werkt
                </motion.p>
                <motion.h2 
                  className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
                  {...fadeUp}
                  transition={fadeUpTransition(0.05)}
                >
                  In drie stappen live met facturen, offertes en BTW
                </motion.h2>
                <motion.p 
                  className="text-lg leading-relaxed text-slate-600"
                  {...fadeUp}
                  transition={fadeUpTransition(0.1)}
                >
                  Geen overbodige modules. Alleen wat je nodig hebt om documenten te versturen en overzicht te houden.
                </motion.p>
              </div>
              <div className="grid gap-6">
                {howItWorks.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.title}
                      className="group flex items-start gap-4 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-1 hover:border-emerald-200/60 hover:shadow-[0_12px_48px_-16px_rgba(16,185,129,0.12)]"
                      {...staggeredCard(0.1 * idx)}
                    >
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 ring-1 ring-emerald-200/50 transition-all duration-500 group-hover:scale-110 group-hover:from-emerald-500/20 group-hover:to-teal-500/20">
                        <Icon className="h-7 w-7 text-emerald-600" aria-hidden />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Stap {idx + 1}</p>
                        <p className="text-lg font-bold text-slate-900">{step.title}</p>
                        <p className="leading-relaxed text-slate-600">{step.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
              <div className="space-y-5">
                <motion.p 
                  className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600"
                  {...fadeUp}
                >
                  FAQ
                </motion.p>
                <motion.h2 
                  className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
                  {...fadeUp}
                  transition={fadeUpTransition(0.05)}
                >
                  Snel antwoord op de belangrijkste vragen
                </motion.h2>
                <motion.p 
                  className="text-lg leading-relaxed text-slate-600"
                  {...fadeUp}
                  transition={fadeUpTransition(0.1)}
                >
                  Gericht op onboarding, betalingen en beveiliging. Alles binnen het product en zonder wachttijd.
                </motion.p>
              </div>
              <div className="grid gap-4">
                {landingFaq.map((item, idx) => (
                  <motion.div
                    key={item.question}
                    className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white p-6 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06)] transition-all duration-300 hover:border-emerald-200/60 hover:shadow-[0_8px_32px_-12px_rgba(16,185,129,0.1)]"
                    {...staggeredCard(0.08 * idx)}
                  >
                    <p className="text-lg font-bold text-slate-900">{item.question}</p>
                    <p className="mt-2 leading-relaxed text-slate-600">{item.answer}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="support" className="bg-gradient-to-b from-slate-50 to-white py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="space-y-6">
                <motion.div
                  className="inline-flex items-center gap-2.5 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-700 ring-1 ring-slate-200/80 shadow-sm"
                  {...fadeUp}
                >
                  <LifeBuoy className="h-4 w-4" aria-hidden />
                  Support
                </motion.div>
                <motion.h2 
                  className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
                  {...fadeUp}
                  transition={fadeUpTransition(0.05)}
                >
                  Premium support voor jouw gemoedsrust
                </motion.h2>
                <motion.p 
                  className="text-lg leading-relaxed text-slate-700"
                  {...fadeUp}
                  transition={fadeUpTransition(0.1)}
                >
                  Bereik ons direct vanuit de landing. Naam, e-mail, onderwerp en bericht zijn genoeg. We bevestigen je aanvraag en antwoorden snel.
                </motion.p>
                <motion.div 
                  className="grid gap-4 sm:grid-cols-2"
                  {...fadeUp}
                  transition={fadeUpTransition(0.15)}
                >
                  <div className="rounded-3xl border border-slate-200/60 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900">
                      <MailCheck className="h-5 w-5 text-emerald-600" aria-hidden />
                      Bevestiging per mail
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">Heldere status na verzenden, zonder chat-widgets.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200/60 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden />
                      Focus op product
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">Facturen, BTW, uren en abonnement zijn onze prioriteit.</p>
                  </div>
                </motion.div>
              </div>
              <SupportForm context="Landing" minimal />
            </div>
          </div>
        </section>

        <section id="pricing" className="relative overflow-hidden bg-gradient-to-br from-[#0a3540] via-[#0d4a56] to-[#0a3540] py-28 sm:py-32">
          {/* Enhanced ambient background */}
          <div className="absolute inset-0">
            <div className="absolute left-10 top-10 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-teal-500/8 blur-[160px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] opacity-30" />
          </div>
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                className="mx-auto inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.25em] text-emerald-200 shadow-[0_8px_32px_-12px_rgba(16,185,129,0.3)] backdrop-blur-sm ring-1 ring-emerald-400/20"
                {...fadeUp}
              >
                14 Dagen Gratis
                <BrandZ className="h-4 w-4" aria-hidden />
              </motion.div>
              <motion.h2
                className="mt-8 text-5xl font-bold tracking-tight text-white sm:text-6xl"
                {...fadeUp}
                transition={fadeUpTransition(0.05)}
              >
                €4,99/mnd · All-in-one Elite
              </motion.h2>
              <motion.p
                className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-slate-200"
                {...fadeUp}
                transition={fadeUpTransition(0.1)}
              >
                Eén plan met alles erin. Inclusief Midnight Shield beveiliging, audit trails, premium support én 14 dagen gratis proberen.
              </motion.p>
            </div>

            <div className="relative mx-auto mt-20 max-w-4xl">
              {/* Enhanced glow effect */}
              <div className="absolute inset-8 -z-10 rounded-[48px] bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-emerald-500/30 blur-[120px]" />
              
              <motion.div
                className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-10 shadow-[0_32px_128px_-48px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-12"
                {...fadeUp}
                transition={fadeUpTransition(0.15)}
              >
                {/* Inner glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_60%)]" />
                
                <div className="relative flex flex-col items-center gap-3 text-center">
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-100 backdrop-blur-sm">
                    Elite Plan
                  </div>
                  <p className="text-base text-slate-200">Ultieme focus, premium design, altijd opzegbaar.</p>
                  <div className="mt-6 flex items-end gap-3 text-white">
                    <span className="text-7xl font-bold tracking-tight">€4,99</span>
                    <span className="mb-3 text-xl font-medium text-slate-200">/ mnd</span>
                  </div>
                </div>
                
                <div className="relative mt-12 grid gap-5 sm:grid-cols-2">
                  {elitePerks.map((perk, idx) => (
                    <motion.div
                      key={perk}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-relaxed text-slate-100 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * idx, duration: 0.4 }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" aria-hidden />
                      <span>{perk}</span>
                    </motion.div>
                  ))}
                </div>
                
                <p className="relative mt-8 text-center text-base font-semibold text-slate-200">
                  14 dagen gratis proberen. Daarna €4,99 per maand. Geen kleine lettertjes.
                </p>
                
                <div className="relative mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <LandingCtaButton
                    href={isLoggedIn ? "/dashboard" : "/register"}
                    paddingClass="px-10 py-4"
                    className="w-full justify-center text-lg shadow-[0_20px_80px_-32px_rgba(16,185,129,0.6)] sm:w-auto"
                  >
                    {primaryCta}
                    <ArrowRight className="ml-2 h-6 w-6" aria-hidden />
                  </LandingCtaButton>
                  <div className="flex items-center gap-2.5 text-sm font-medium uppercase tracking-[0.2em] text-slate-300">
                    <Infinity className="h-5 w-5" aria-hidden />
                    Altijd opzegbaar
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-24 sm:py-28">
          {/* Subtle ambient glow */}
          <div className="absolute inset-0">
            <div className="absolute left-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
            <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-teal-500/5 blur-[100px]" />
          </div>
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center text-white">
              <motion.h2 
                className="text-4xl font-bold tracking-tight sm:text-5xl"
                {...fadeUp}
              >
                Klaar om te starten?
              </motion.h2>
              <motion.p 
                className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-slate-300"
                {...fadeUp}
                transition={fadeUpTransition(0.05)}
              >
                Sluit je aan bij honderden ZZP&apos;ers die al besparen op administratietijd.
              </motion.p>
              <motion.div 
                className="mt-12 flex items-center justify-center gap-4"
                {...fadeUp}
                transition={fadeUpTransition(0.1)}
              >
                <LandingCtaButton
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  paddingClass="px-10 py-4"
                  className="text-lg shadow-[0_24px_80px_-32px_rgba(16,185,129,0.5)]"
                >
                  {primaryCta}
                  <ArrowRight className="ml-2 h-6 w-6" aria-hidden />
                </LandingCtaButton>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-[#0a0d12] py-16 text-slate-300">
        {/* Subtle background decoration */}
        <div className="absolute inset-0">
          <div className="absolute left-1/3 top-0 h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[100px]" />
          <div className="absolute right-1/3 top-0 h-[300px] w-[300px] rounded-full bg-teal-500/5 blur-[100px]" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 ring-1 ring-white/10">
                <BrandZ className="h-6 w-6 text-white" aria-hidden />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">ZZP-HUB</span>
            </div>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-300 backdrop-blur-sm">
              <BrandZ className="h-4 w-4 text-emerald-400" aria-hidden />
              Signature edition
            </div>
            
            {/* Powered by */}
            <p className="text-sm font-semibold tracking-tight text-slate-400">Powered by MHM IT</p>
            
            {/* Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
              <Link href="/privacy" className="transition-colors duration-300 hover:text-emerald-400">
                Privacy
              </Link>
              <Link href="/voorwaarden" className="transition-colors duration-300 hover:text-emerald-400">
                Voorwaarden
              </Link>
              <Link href="/contact" className="transition-colors duration-300 hover:text-emerald-400">
                Contact
              </Link>
            </div>
            
            {/* Copyright */}
            <div className="border-t border-white/5 pt-6 text-center">
              <p className="text-xs text-slate-500">© 2024 ZZP-HUB. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
