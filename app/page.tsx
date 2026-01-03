import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, FileText, Timer, Sparkles, Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerAuthSession } from "@/lib/auth";

const features = [
  {
    title: "Facturatie",
    description: "Professionele facturen maken en versturen in seconden. Automatische herinneringen en betalingstracking.",
    icon: FileText,
  },
  {
    title: "BTW-aangifte",
    description: "Automatische BTW-berekeningen en rapportages. Altijd klaar voor je kwartaalaangifte.",
    icon: Calculator,
  },
  {
    title: "Urenregistratie",
    description: "Houd moeiteloos je 1225-uren criterium bij. Inzicht in je werkweek en projecten.",
    icon: Timer,
  },
];

const pricing = [
  {
    name: "Starter",
    price: "Gratis",
    detail: "Voor starters",
    features: [
      "Tot 10 facturen per maand",
      "Basis urenregistratie",
      "BTW-overzicht",
      "E-mail support"
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
      "Export naar boekhouder"
    ],
  },
];

const trustLogos = [
  "Creative Studio A",
  "Consultant B",
  "Developer C",
  "Designer D",
];

export default async function LandingPagina() {
  const session = await getServerAuthSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl">ZZP-HUB</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link href="#features" className="transition-colors hover:text-indigo-600">
              Features
            </Link>
            <Link href="#pricing" className="transition-colors hover:text-indigo-600">
              Prijzen
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                className={buttonVariants("primary", "shadow-lg shadow-indigo-500/30")}
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={buttonVariants("ghost", "hidden md:inline-flex")}
                >
                  Inloggen
                </Link>
                <Link 
                  href="/register" 
                  className={buttonVariants("primary", "shadow-lg shadow-indigo-500/30")}
                >
                  Gratis starten
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white pb-20 pt-16 sm:pt-24 lg:pt-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
                <span>Voor moderne ZZP&apos;ers</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                Slimme Boekhouding
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  voor ZZP&apos;ers
                </span>
              </h1>
              <p className="mb-10 text-lg leading-relaxed text-slate-600 sm:text-xl">
                Factureren, urenregistratie en BTW-aangifte in één overzichtelijk platform.
                <br className="hidden sm:inline" />
                Stop met Excel, start met groeien.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link 
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className={buttonVariants("primary", "text-base px-8 py-3 shadow-xl shadow-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-105")}
                >
                  {isLoggedIn ? "Go to Dashboard" : "Gratis starten"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button
                  className={buttonVariants("secondary", "text-base px-8 py-3 group")}
                >
                  <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  Bekijk demo
                </button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>Geen creditcard nodig • 14 dagen gratis proberen</span>
              </div>
            </div>

            {/* Hero Image */}
            <div className="mt-16 sm:mt-20">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="bg-gradient-to-b from-white to-slate-50 p-4">
                  <Image
                    src="/window.svg"
                    alt="ZZP-HUB Dashboard Preview"
                    width={1200}
                    height={800}
                    className="h-auto w-full rounded-lg border border-slate-200"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Features</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Alles wat je nodig hebt
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Bespaar tijd en focus op wat echt belangrijk is: ondernemen.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.title} 
                    className="border-slate-200 bg-white shadow-lg shadow-slate-900/5 transition-all hover:shadow-xl hover:shadow-slate-900/10"
                  >
                    <CardHeader>
                      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
                        <Icon className="h-7 w-7" />
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Trusted by modern entrepreneurs
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Meer dan 500 ZZP&apos;ers bouwen met ons
              </h3>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
              {trustLogos.map((logo) => (
                <div
                  key={logo}
                  className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm font-semibold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Prijzen</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Transparante pakketten
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Kies het plan dat bij jouw groei past. Altijd opzegbaar.
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
              {pricing.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative overflow-hidden border-2 bg-white shadow-xl transition-all hover:shadow-2xl ${
                    plan.featured
                      ? "border-indigo-600 ring-4 ring-indigo-100"
                      : "border-slate-200"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute right-0 top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-1 text-xs font-bold uppercase text-white">
                      {plan.detail}
                    </div>
                  )}
                  <CardHeader className="pb-8 pt-10">
                    <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-5xl font-bold tracking-tight text-slate-900">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-lg font-medium text-slate-600">{plan.period}</span>
                      )}
                    </div>
                    {!plan.featured && (
                      <p className="mt-2 text-sm text-slate-600">{plan.detail}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={isLoggedIn ? "/dashboard" : "/register"}
                      className={buttonVariants(
                        plan.featured ? "primary" : "secondary",
                        `w-full justify-center text-base py-3 ${
                          plan.featured ? "shadow-lg shadow-indigo-500/30" : ""
                        }`
                      )}
                    >
                      {isLoggedIn ? "Go to Dashboard" : `Start met ${plan.name}`}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-blue-600 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Klaar om te starten?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
                Sluit je aan bij honderden ZZP&apos;ers die al besparen op administratietijd.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className={buttonVariants("secondary", "text-base px-8 py-3 bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl")}
                >
                  {isLoggedIn ? "Go to Dashboard" : "Gratis starten"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span>ZZP-HUB</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <Link href="/privacy" className="transition-colors hover:text-indigo-600">
                Privacy
              </Link>
              <Link href="/voorwaarden" className="transition-colors hover:text-indigo-600">
                Voorwaarden
              </Link>
              <Link href="/contact" className="transition-colors hover:text-indigo-600">
                Contact
              </Link>
            </div>
            <p className="text-sm text-slate-600">
              © 2024 ZZP-HUB. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
