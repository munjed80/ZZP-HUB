import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, FileText, Timer, Wallet, WalletCards } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Facturatie",
    description: "Maak en verstuur facturen in seconden.",
    icon: FileText,
  },
  {
    title: "Urenregistratie",
    description: "Houd eenvoudig je 1225-uren criterium bij.",
    icon: Timer,
  },
  {
    title: "BTW-Aangifte",
    description: "Zie direct wat je elk kwartaal moet betalen.",
    icon: Calculator,
  },
  {
    title: "Kostenbeheer",
    description: "Scan bonnetjes en verlaag je belasting.",
    icon: Wallet,
  },
];

const pricing = [
  {
    name: "Starter",
    price: "Gratis",
    detail: "Beperkt",
    features: ["Basis facturatie", "Eenvoudige urenregistratie", "Beperkte opslag"],
  },
  {
    name: "Pro",
    price: "€15/mnd",
    detail: "Meest gekozen",
    featured: true,
    features: ["Alles onbeperkt", "BTW-hulp & rapportages", "Prioriteitsupport"],
  },
  {
    name: "Enterprise",
    price: "€50/mnd",
    detail: "Maatwerk",
    features: ["Dedicated support", "SSO & rollen", "API-toegang"],
  },
];

export default function LandingPagina() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-100/60 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-800 text-white">
              ZZ
            </div>
            <span>ZZP-HUB</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <Link href="#kenmerken" className="hover:text-blue-700">
              Kenmerken
            </Link>
            <Link href="#prijzen" className="hover:text-blue-700">
              Prijzen
            </Link>
            <Link href="#over-ons" className="hover:text-blue-700">
              Over ons
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className={buttonVariants("ghost", "hidden md:inline-flex")}>
              Inloggen
            </Link>
            <Link href="/register" className={buttonVariants("primary")}>
              Gratis starten
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-24">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-blue-50" aria-hidden />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700 ring-1 ring-blue-100">
                Gemaakt voor Nederlandse ZZP&apos;ers
              </span>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                De slimste administratie tool voor Nederlandse ZZP&apos;ers.
              </h1>
              <p className="max-w-2xl text-lg text-slate-700">
                Facturen, offertes, urenregistratie en BTW-aangifte in één overzichtelijk dashboard. Stop met Excel,
                start met groeien.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/register" className={buttonVariants("primary", "w-full sm:w-auto text-base px-6 py-3")}>
                  Start 14 dagen gratis
                </Link>
                <Link
                  href="#demo"
                  className={buttonVariants("secondary", "w-full sm:w-auto text-base px-6 py-3")}
                >
                  Bekijk demo
                </Link>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                <span>Geen creditcard nodig &middot; Binnen 5 minuten live</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex -space-x-2">
                  <div className="h-9 w-9 rounded-full bg-blue-100" />
                  <div className="h-9 w-9 rounded-full bg-sky-100" />
                  <div className="h-9 w-9 rounded-full bg-indigo-100" />
                </div>
                <p className="font-semibold text-slate-800">Al gebruikt door 500+ ZZP&apos;ers in Nederland.</p>
              </div>
            </div>

            <div id="demo" className="flex-1">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-blue-100/50">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <p className="text-sm font-semibold text-slate-700">Dashboard voorbeeld</p>
                </div>
                <div className="bg-gradient-to-b from-white to-slate-50 px-4 pb-4 pt-2">
                  <Image
                    src="/window.svg"
                    alt="Voorbeeld van het ZZP-HUB dashboard"
                    width={1200}
                    height={800}
                    className="h-auto w-full rounded-lg border border-slate-100"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="kenmerken" className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-blue-700">Kenmerken</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Alles wat je nodig hebt om te automatiseren.</h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                ZZP-HUB bundelt facturatie, offertes, urenregistratie en belastingtaken in één moeiteloze workflow.
              </p>
            </div>
            <Link href="/register" className={buttonVariants("ghost", "hidden text-sm font-semibold text-blue-700 lg:inline-flex")}>
              Start nu <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-slate-100 bg-white shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-start gap-6 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-8 py-10 text-white shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-wide">Social Proof</p>
            <h3 className="text-2xl font-bold sm:text-3xl">Al gebruikt door 500+ ZZP&apos;ers in Nederland.</h3>
            <p className="max-w-3xl text-white/80">
              Van creatives tot consultants: klanten besparen gemiddeld 6 uur per week op administratie met ZZP-HUB.
            </p>
            <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center justify-center rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold">
                Logo A
              </div>
              <div className="flex items-center justify-center rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold">
                Logo B
              </div>
              <div className="flex items-center justify-center rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold">
                Logo C
              </div>
              <div className="flex items-center justify-center rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold">
                Logo D
              </div>
            </div>
          </div>
        </section>

        <section id="prijzen" className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase text-blue-700">Prijzen</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Transparante pakketten zonder verrassingen.</h2>
            <p className="mt-3 text-slate-600">Kies het abonnement dat past bij jouw groei.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pricing.map((tier) => (
              <Card
                key={tier.name}
                className={`border-slate-100 bg-white shadow-sm ${tier.featured ? "ring-2 ring-blue-500" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    {tier.featured && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Populair
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{tier.price}</p>
                  <p className="text-sm text-slate-500">{tier.detail}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-slate-700">
                    {tier.features.map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/register"
                    className={buttonVariants(tier.featured ? "primary" : "secondary", "w-full justify-center")}
                  >
                    Probeer {tier.name.toLowerCase()}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="over-ons" className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-8 rounded-2xl bg-white p-8 shadow-sm lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase text-blue-700">Over ons</p>
              <h3 className="text-2xl font-bold text-slate-900">Gebouwd door en voor Nederlandse freelancers.</h3>
              <p className="text-slate-600">
                ZZP-HUB is ontstaan uit de frustratie over versnipperde tools. We combineren boekhouding, uren en
                rapportages in een vriendelijke ervaring zodat jij kunt focussen op ondernemen.
              </p>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <WalletCards className="h-5 w-5 text-blue-600" aria-hidden />
                <span>Veilig, AVG-proof en hosten op Europese servers.</span>
              </div>
            </div>
            <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Support team</p>
                  <p className="text-sm text-slate-600">Antwoord binnen 24 uur op werkdagen.</p>
                </div>
              </div>
              <p className="text-sm text-slate-700">
                “We willen dat administratie voelt als een product dat voor jou werkt. Daarom testen we elke release met
                een groep actieve ZZP&apos;ers.”
              </p>
              <Link href="/register" className={buttonVariants("primary", "justify-center")}>
                Gratis starten
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-600 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="text-blue-700">ZZP-HUB</span>
            <span className="text-slate-400">|</span>
            <span>Copyright 2024 ZZP-HUB</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-blue-700">
              Privacy
            </Link>
            <Link href="/voorwaarden" className="hover:text-blue-700">
              Voorwaarden
            </Link>
            <Link href="/contact" className="hover:text-blue-700">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
