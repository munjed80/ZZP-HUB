import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const bedrijf = {
  companyName: "ZZP HUB Demo BV",
  logoUrl: "",
  address: "Prinsengracht 100",
  postalCode: "1015 EA",
  city: "Amsterdam",
  kvkNumber: "81234567",
  btwNumber: "NL123456789B01",
  iban: "NL00BANK0123456789",
  bankName: "Bank NL",
  paymentTerms: "14 dagen",
};

const klant = {
  naam: "Studio Delta",
  adres: "Keizersgracht 12",
  postcode: "1015 CX",
  plaats: "Amsterdam",
  btw: "NL998877665B01",
};

const regels = [
  {
    omschrijving: "Ontwerp & development sprint",
    hoeveelheid: 24,
    eenheid: "Uur",
    tarief: "21%",
    prijs: 95,
  },
  {
    omschrijving: "Onderhoudscontract",
    hoeveelheid: 1,
    eenheid: "Project",
    tarief: "9%",
    prijs: 450,
  },
];

export default function FactuurVoorbeeldPagina() {
  const totaal = regels.reduce((sum, regel) => sum + regel.hoeveelheid * regel.prijs, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Factuurweergave</h1>
        <p className="text-sm text-slate-600">
          Print/PDF-geschikte layout met slimme fallback: als er geen logo is, tonen we de bedrijfsnaam prominent.
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader className="border-b border-slate-200 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="w-1/2 space-y-3">
              <CardTitle>FACTUUR</CardTitle>
              <Badge variant="info">Concept</Badge>
              <div className="text-sm text-slate-700">
                <p>Factuurnummer: INV-2025-015</p>
                <p>Datum: 10-02-2025 · Vervaldatum: 24-02-2025</p>
              </div>
            </div>
            <div className="w-1/2 text-right">
              {bedrijf.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bedrijf.logoUrl} alt="Bedrijfslogo" className="ml-auto h-12 w-auto object-contain" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-slate-900">{bedrijf.companyName}</p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Verzender</p>
              <p className="text-sm text-slate-700">{bedrijf.companyName}</p>
              <p className="text-sm text-slate-700">
                {bedrijf.address}, {bedrijf.postalCode} {bedrijf.city}
              </p>
              <p className="text-sm text-slate-700">KVK: {bedrijf.kvkNumber}</p>
              <p className="text-sm text-slate-700">BTW: {bedrijf.btwNumber}</p>
              <p className="text-sm text-slate-700">IBAN: {bedrijf.iban} ({bedrijf.bankName})</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Ontvanger</p>
              <p className="text-sm text-slate-700">{klant.naam}</p>
              <p className="text-sm text-slate-700">{klant.adres}</p>
              <p className="text-sm text-slate-700">
                {klant.postcode} {klant.plaats}
              </p>
              <p className="text-sm text-slate-700">BTW-id: {klant.btw}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-5 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <span>Omschrijving</span>
              <span className="text-center">Aantal</span>
              <span className="text-center">Eenheid</span>
              <span className="text-center">BTW</span>
              <span className="text-right">Bedrag</span>
            </div>
            <div className="divide-y divide-slate-200">
              {regels.map((regel) => (
                <div
                  key={regel.omschrijving}
                  className="grid grid-cols-5 px-4 py-3 text-sm text-slate-800"
                >
                  <span className="pr-4">{regel.omschrijving}</span>
                  <span className="text-center">{regel.hoeveelheid}</span>
                  <span className="text-center">{regel.eenheid}</span>
                  <span className="text-center">{regel.tarief}</span>
                  <span className="text-right">{formatBedrag(regel.hoeveelheid * regel.prijs)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-sm text-slate-800">
            <div className="flex w-full max-w-md items-center justify-between">
              <span>Subtotaal (excl. BTW)</span>
              <span className="font-semibold">{formatBedrag(totaal)}</span>
            </div>
            <div className="flex w-full max-w-md items-center justify-between">
              <span>BTW gespecificeerd (21% / 9% / verlegd)</span>
              <span className="font-semibold text-slate-900">Automatisch berekend</span>
            </div>
            <div className="flex w-full max-w-md items-center justify-between text-base font-bold">
              <span>Totaal te betalen</span>
              <span>{formatBedrag(totaal)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-600">Betaaltermijn: {bedrijf.paymentTerms}</p>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-800">
            <p>Print/PDF-view zorgt voor duidelijke scheiding tussen verzender en ontvanger.</p>
            <button className={buttonVariants("primary", "px-4 py-2 text-sm font-semibold")}>
              Print / Exporteer PDF
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
