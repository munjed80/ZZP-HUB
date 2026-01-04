import { LifeBuoy, MailCheck, ShieldCheck } from "lucide-react";
import { assistantGuide } from "@/lib/assistant/knowledge";
import { SupportForm } from "@/components/support/support-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700 ring-1 ring-teal-100">
            <LifeBuoy className="h-4 w-4" aria-hidden />
            Support
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">We helpen je graag verder</h1>
          <p className="text-[var(--muted)]">
            Stel je vraag over facturatie, BTW, uren of abonnement. Ons team reageert snel met een concreet antwoord.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden />
          <span>Premium support in het Nederlands</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SupportForm context="Dashboard" />

        <div className="space-y-4">
          <Card className="border-[var(--border)] bg-white/95 shadow-md shadow-slate-200/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MailCheck className="h-5 w-5 text-teal-600" aria-hidden />
                Veelgestelde onderwerpen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted)]">
              <p>• Eerste factuur of offerte verzenden</p>
              <p>• BTW-overzicht en kwartaalrapport</p>
              <p>• Urenregistratie voor het 1225-criterium</p>
              <p>• Abonnement of facturatie van ZZP HUB</p>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--background-secondary)] shadow-none ring-1 ring-[var(--border)]/80">
            <CardContent className="space-y-2 p-5 text-sm text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">Snellere reactie</p>
              <p>Vermeld je bedrijfsnaam of factuurnummer zodat we je direct kunnen helpen.</p>
              <p className="text-xs text-[var(--muted)]">We reageren doorgaans binnen één werkdag.</p>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-white/95 shadow-md shadow-slate-200/70">
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assistantGuide.faq.slice(0, 4).map((item) => (
                <div key={item.question} className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.question}</p>
                  <p className="text-sm text-[var(--muted)]">{item.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
