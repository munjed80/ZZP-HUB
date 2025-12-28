"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  companyName: z.string().min(2, "Bedrijfsnaam is verplicht"),
  address: z.string().min(2, "Adres is verplicht"),
  postalCode: z.string().min(4, "Postcode is verplicht"),
  city: z.string().min(2, "Plaats is verplicht"),
  kvkNumber: z.string().min(6, "KVK-nummer is verplicht"),
  btwNumber: z.string().min(4, "BTW-nummer is verplicht"),
  iban: z.string().min(8, "IBAN is verplicht"),
  bankName: z.string().min(2, "Bank is verplicht"),
  paymentTerms: z.string().min(2, "Betaaltermijn is verplicht"),
  logoUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const abonnement = {
  type: "Maandelijks",
  prijs: "€29,00",
  status: "Actief",
};

export default function InstellingenPagina() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "ZZP HUB Demo BV",
      address: "Prinsengracht 100",
      postalCode: "1015 EA",
      city: "Amsterdam",
      kvkNumber: "81234567",
      btwNumber: "NL123456789B01",
      iban: "NL00BANK0123456789",
      bankName: "Bank NL",
      paymentTerms: "14 dagen",
      logoUrl: "",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Instellingen</h1>
        <p className="text-sm text-slate-600">
          Beheer profiel, bedrijfsgegevens en abonnement. Deze gegevens vullen automatisch de factuur-header en -footer.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-white">
          <CardHeader>
            <CardTitle>Bedrijfsprofiel</CardTitle>
            <Badge variant="info">Auto-fill facturen</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { name: "companyName", label: "Bedrijfsnaam" },
                { name: "address", label: "Adres" },
                { name: "postalCode", label: "Postcode" },
                { name: "city", label: "Plaats" },
                { name: "kvkNumber", label: "KVK-nummer" },
                { name: "btwNumber", label: "BTW-nummer" },
                { name: "iban", label: "IBAN" },
                { name: "bankName", label: "Banknaam" },
                { name: "paymentTerms", label: "Betaaltermijn" },
                { name: "logoUrl", label: "Logo URL (optioneel)" },
              ].map((veld) => (
                <div key={veld.name} className="space-y-1">
                  <label className="text-sm font-medium text-slate-800">{veld.label}</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    {...form.register(veld.name as keyof FormData)}
                  />
                  {form.formState.errors[veld.name as keyof FormData] && (
                    <p className="text-xs text-amber-700">
                      {form.formState.errors[veld.name as keyof FormData]?.message as string}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={form.handleSubmit((data) => console.log("Instellingen opgeslagen", data))}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Opslaan
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Abonnement</CardTitle>
            <Badge variant="success">Maandelijks</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-slate-700">
              {abonnement.type} tarief: {abonnement.prijs} per maand. Opzegbaar per
              maand en gericht op groeiende freelancers.
            </p>
            <p className="text-sm font-semibold text-slate-900">Status: {abonnement.status}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
