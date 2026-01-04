import { LifeBuoy, MailCheck, ShieldCheck } from "lucide-react";
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">We helpen je graag verder</h1>
          <p className="text-slate-600">
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
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MailCheck className="h-5 w-5 text-teal-600" aria-hidden />
                Veelgestelde onderwerpen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>• Eerste factuur of offerte verzenden</p>
              <p>• BTW-overzicht en kwartaalrapport</p>
              <p>• Urenregistratie voor het 1225-criterium</p>
              <p>• Abonnement of facturatie van ZZP HUB</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50 shadow-none ring-1 ring-slate-200/60">
            <CardContent className="space-y-2 p-5 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Snellere reactie</p>
              <p>Vermeld je bedrijfsnaam of factuurnummer zodat we je direct kunnen helpen.</p>
              <p className="text-xs text-slate-500">We reageren doorgaans binnen één werkdag.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
