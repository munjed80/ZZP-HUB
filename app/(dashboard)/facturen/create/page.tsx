"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatBedrag } from "@/lib/utils";

const klanten = [
  {
    id: "client-1",
    naam: "Studio Delta",
    adres: "Keizersgracht 12",
    postcode: "1015 CX",
    plaats: "Amsterdam",
    btw: "NL123456789B01",
  },
  {
    id: "client-2",
    naam: "Gemeente Utrecht",
    adres: "Stadsplateau 1",
    postcode: "3521 AZ",
    plaats: "Utrecht",
    btw: "NL987654321B01",
  },
];

const bedrijfsinstellingen = {
  companyName: "ZZP HUB Demo BV",
  address: "Prinsengracht 100",
  postalCode: "1015 EA",
  city: "Amsterdam",
  iban: "NL00BANK0123456789",
  paymentTerms: "14 dagen",
  logoUrl: "",
};

const schema = z.object({
  invoiceNum: z.string().min(3, "Factuurnummer is verplicht"),
  klantId: z.string().min(1, "Klant is verplicht"),
  datum: z.string().min(1, "Factuurdatum is verplicht"),
  vervaldatum: z.string().min(1, "Vervaldatum is verplicht"),
  tarief: z.enum(["21%", "9%", "0%", "verlegd"]),
  omschrijving: z.string().min(3, "Omschrijving is verplicht"),
  hoeveelheid: z.coerce.number().positive(),
  prijs: z.coerce.number().positive(),
  eenheid: z.enum(["Uur", "Stuk", "Project"]),
});

type FormData = z.infer<typeof schema>;

export default function FactuurAanmakenPagina() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tarief: "21%",
      eenheid: "Uur",
    },
  });

  const klantId = useWatch({ control: form.control, name: "klantId" });
  const hoeveelheid = useWatch({ control: form.control, name: "hoeveelheid" });
  const prijs = useWatch({ control: form.control, name: "prijs" });
  const geselecteerdeKlant = klanten.find((k) => k.id === klantId);

  useEffect(() => {
    if (geselecteerdeKlant) {
      form.setValue("omschrijving", `Werkzaamheden voor ${geselecteerdeKlant.naam}`);
    }
  }, [geselecteerdeKlant, form]);

  const totaal = (hoeveelheid || 0) * (prijs || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Factuur opstellen</h1>
        <p className="text-sm text-slate-600">
          Header en footer worden automatisch gevuld met bedrijfsgegevens uit Instellingen. BTW-tarieven 21%, 9%, 0% of verlegd worden ondersteund.
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Factuurdetails</CardTitle>
            <Badge variant="info">Concept</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Factuurnummer</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...form.register("invoiceNum")}
                placeholder="INV-2025-013"
              />
              {form.formState.errors.invoiceNum && (
                <p className="text-xs text-amber-700">{form.formState.errors.invoiceNum.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Klant</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...form.register("klantId")}
              >
                <option value="">Kies een klant</option>
                {klanten.map((klant) => (
                  <option key={klant.id} value={klant.id}>
                    {klant.naam}
                  </option>
                ))}
              </select>
              {form.formState.errors.klantId && (
                <p className="text-xs text-amber-700">{form.formState.errors.klantId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Factuurdatum</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...form.register("datum")}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Vervaldatum</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...form.register("vervaldatum")}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">BTW-tarief</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...form.register("tarief")}
              >
                <option value="21%">21% (hoog)</option>
                <option value="9%">9% (laag)</option>
                <option value="0%">0% (vrijgesteld)</option>
                <option value="verlegd">BTW verlegd</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Eenheid</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...form.register("eenheid")}
              >
                <option>Uur</option>
                <option>Stuk</option>
                <option>Project</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium text-slate-800">Omschrijving</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                {...form.register("omschrijving")}
                placeholder="Consultancy, development of onderhoud"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Hoeveelheid</label>
              <input
                type="number"
                step="0.1"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...form.register("hoeveelheid")}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Prijs per eenheid</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...form.register("prijs")}
              />
            </div>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle>Afzender (automatisch)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  {bedrijfsinstellingen.companyName}
                </p>
                <p>
                  {bedrijfsinstellingen.address}, {bedrijfsinstellingen.postalCode}{" "}
                  {bedrijfsinstellingen.city}
                </p>
                <p>IBAN: {bedrijfsinstellingen.iban}</p>
                <p>Betaaltermijn: {bedrijfsinstellingen.paymentTerms}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle>Klantadres</CardTitle>
              </CardHeader>
              <CardContent className={cn("text-sm text-slate-700", !geselecteerdeKlant && "italic text-slate-500")}>
                {geselecteerdeKlant ? (
                  <>
                    <p className="font-semibold text-slate-900">{geselecteerdeKlant.naam}</p>
                    <p>{geselecteerdeKlant.adres}</p>
                    <p>
                      {geselecteerdeKlant.postcode} {geselecteerdeKlant.plaats}
                    </p>
                    <p>BTW-id: {geselecteerdeKlant.btw}</p>
                  </>
                ) : (
                  "Selecteer een klant om adres en BTW-gegevens te vullen."
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-800">
            <div>
              Subtotaal excl. BTW: <span className="font-semibold">{formatBedrag(totaal || 0)}</span>
            </div>
            <button
              type="button"
              onClick={form.handleSubmit((data) => console.log("Conceptfactuur", data))}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Opslaan als concept
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
