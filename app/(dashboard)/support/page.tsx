import { LifeBuoy, MailCheck, ShieldCheck } from "lucide-react";
import { SupportForm } from "@/components/support/support-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Hulp en ondersteuning voor ZZP-HUB. Neem contact met ons op voor vragen en problemen.",
};

// Static FAQ data
const faqItems = [
  {
    question: "Hoe maak ik mijn eerste factuur?",
    answer: "Ga naar Facturen → Nieuwe factuur en vul de gegevens in. Je kunt ook een klant selecteren of een nieuwe aanmaken.",
  },
  {
    question: "Hoe bereken ik mijn BTW-aangifte?",
    answer: "Ga naar BTW-aangifte om een overzicht te krijgen van je inkopen en verkopen per kwartaal.",
  },
  {
    question: "Wat is het 1225-urencriterium?",
    answer: "Dit criterium bepaalt of je als ondernemer wordt gezien voor de fiscale voordelen. Registreer je uren in het Uren-overzicht.",
  },
  {
    question: "Hoe nodig ik mijn accountant uit?",
    answer: "Ga naar Instellingen → Accountant en voer het e-mailadres van je accountant in om een uitnodiging te versturen.",
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--brand)/0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--brand))] ring-1 ring-[rgb(var(--brand)/0.2)]">
            <LifeBuoy className="h-4 w-4" aria-hidden />
            Support
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">We helpen je graag verder</h1>
          <p className="text-muted-foreground">
            Stel je vraag over facturatie, BTW, uren of abonnement. Ons team reageert snel met een concreet antwoord.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm shadow-[0_6px_28px_-22px_rgba(var(--brand-glow,var(--brand)),0.18)]">
          <ShieldCheck className="h-4 w-4 text-[rgb(var(--brand))]" aria-hidden />
          <span className="text-muted-foreground">Premium support in het Nederlands</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SupportForm context="Dashboard" />

        <div className="space-y-4">
          <Card className="border-border bg-card/95 shadow-md shadow-[0_18px_48px_-28px_rgba(var(--brand-glow,var(--brand)),0.18)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MailCheck className="h-5 w-5 text-[rgb(var(--brand))]" aria-hidden />
                Veelgestelde onderwerpen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Eerste factuur of offerte verzenden</p>
              <p>• BTW-overzicht en kwartaalrapport</p>
              <p>• Urenregistratie voor het 1225-criterium</p>
              <p>• Abonnement of facturatie van ZZP HUB</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/80 shadow-none ring-1 ring-border/80">
            <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Snellere reactie</p>
              <p>Vermeld je bedrijfsnaam of factuurnummer zodat we je direct kunnen helpen.</p>
              <p className="text-xs text-muted-foreground">We reageren doorgaans binnen één werkdag.</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/95 shadow-md shadow-[0_18px_48px_-28px_rgba(var(--brand-glow,var(--brand)),0.18)]">
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {faqItems.map((item) => (
                <div key={item.question} className="rounded-lg border border-border bg-muted px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">{item.question}</p>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
