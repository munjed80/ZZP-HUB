"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { createQuotation } from "../actions";
import { quotationSchema, type QuotationFormValues } from "../schema";

type Client = {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  email: string;
  kvkNumber: string | null;
  btwId: string | null;
};

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function generateQuotationNumber() {
  const now = Date.now();
  const year = new Date(now).getFullYear();
  const suffix = String(now).slice(-5);
  return `off-${year}-${suffix}`;
}

export function QuotationForm({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(() => clients[0]?.name ?? "");
  const [openList, setOpenList] = useState(false);
  const blurTimeoutRef = useRef<number | null>(null);

  const today = useMemo(() => new Date(), []);
  const defaultValidUntil = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  }, []);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      clientId: clients[0]?.id ?? "",
      quoteNum: generateQuotationNumber(),
      date: formatDateInput(today),
      validUntil: formatDateInput(defaultValidUntil),
      lines: [
        {
          description: "",
          quantity: 1,
          unit: "UUR",
          price: 0,
          vat: "21",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const watchedLines = useWatch({
    control: form.control,
    name: "lines",
  }) || [];

  const selectedClientId = useWatch({
    control: form.control,
    name: "clientId",
  });

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId),
    [clients, selectedClientId],
  );

  const filteredClients = useMemo(() => {
    if (!searchTerm) {
      return clients;
    }

    const term = searchTerm.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.city.toLowerCase().includes(term),
    );
  }, [clients, searchTerm]);

  const subtotal = watchedLines.reduce((total, line) => {
    const quantity = Number(line?.quantity) || 0;
    const price = Number(line?.price) || 0;
    return total + quantity * price;
  }, 0);

  const totalVat = watchedLines.reduce((total, line) => {
    const quantity = Number(line?.quantity) || 0;
    const price = Number(line?.price) || 0;
    const lineTotal = quantity * price;
    if (line?.vat === "21") return total + lineTotal * 0.21;
    if (line?.vat === "9") return total + lineTotal * 0.09;
    return total;
  }, 0);

  const grandTotal = subtotal + totalVat;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await createQuotation(values);
        router.push("/offertes");
      } catch (error) {
        console.error("Offerte opslaan mislukt", error);
      }
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Nieuwe offerte</h1>
        <p className="text-sm text-slate-600">
          Koppel een relatie, vul offerteregels in en verstuur voor akkoord. KVK, BTW en adres worden automatisch ingevuld.
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Offertegegevens</CardTitle>
          <Badge variant="warning">Concept</Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Offertenummer</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  {...form.register("quoteNum")}
                  placeholder="off-2025-001"
                />
                {form.formState.errors.quoteNum && (
                  <p className="text-xs text-amber-700">{form.formState.errors.quoteNum.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Datum</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  {...form.register("date")}
                />
                {form.formState.errors.date && (
                  <p className="text-xs text-amber-700">{form.formState.errors.date.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Geldig tot</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  {...form.register("validUntil")}
                />
                {form.formState.errors.validUntil && (
                  <p className="text-xs text-amber-700">{form.formState.errors.validUntil.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Relatie</label>
              <div className="relative">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Zoek op naam, e-mail of stad"
                value={searchTerm}
                onFocus={() => setOpenList(true)}
                onBlur={() => {
                  if (blurTimeoutRef.current) {
                    clearTimeout(blurTimeoutRef.current);
                  }
                  blurTimeoutRef.current = window.setTimeout(() => setOpenList(false), 150);
                }}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setOpenList(true);
                  if (e.target.value === "") {
                    form.setValue("clientId", "");
                    }
                  }}
                />
                {openList && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {filteredClients.length === 0 && (
                      <p className="px-3 py-2 text-sm text-slate-600">Geen matches gevonden.</p>
                    )}
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          form.setValue("clientId", client.id, { shouldValidate: true });
                          setSearchTerm(client.name);
                          setOpenList(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <div className="font-semibold text-slate-900">{client.name}</div>
                        <div className="text-xs text-slate-500">{client.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.formState.errors.clientId && (
                <p className="text-xs text-amber-700">{form.formState.errors.clientId.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle>Relatie adres</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">
                  {selectedClient ? (
                    <>
                      <p className="font-semibold text-slate-900">{selectedClient.name}</p>
                      <p>{selectedClient.address}</p>
                      <p>
                        {selectedClient.postalCode} {selectedClient.city}
                      </p>
                      <p className="text-xs text-slate-600">KVK: {selectedClient.kvkNumber || "—"}</p>
                      <p className="text-xs text-slate-600">BTW-id: {selectedClient.btwId || "—"}</p>
                    </>
                  ) : (
                    <p className="italic text-slate-500">Selecteer een relatie om adresgegevens te tonen.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">
                  <p>Conceptofferte. Pas geldigheid, prijzen en BTW per regel aan.</p>
                </CardContent>
              </Card>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Omschrijving</th>
                    <th className="px-3 py-2">Aantal</th>
                    <th className="px-3 py-2">Eenheid</th>
                    <th className="px-3 py-2">Prijs</th>
                    <th className="px-3 py-2">BTW</th>
                    <th className="px-3 py-2 text-right">Totaal</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((field, index) => {
                    const lineTotal = (Number(watchedLines[index]?.quantity) || 0) * (Number(watchedLines[index]?.price) || 0);

                    return (
                      <tr key={field.id} className="align-top">
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                            placeholder="Omschrijving"
                            {...form.register(`lines.${index}.description` as const)}
                            defaultValue={field.description}
                          />
                          {form.formState.errors.lines?.[index]?.description && (
                            <p className="text-xs text-amber-700">
                              {form.formState.errors.lines[index]?.description?.message}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-24 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                            {...form.register(`lines.${index}.quantity` as const, { valueAsNumber: true })}
                            defaultValue={field.quantity}
                          />
                          {form.formState.errors.lines?.[index]?.quantity && (
                            <p className="text-xs text-amber-700">
                              {form.formState.errors.lines[index]?.quantity?.message}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-28 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                            {...form.register(`lines.${index}.unit` as const)}
                            defaultValue={field.unit}
                          >
                            <option value="UUR">Uur</option>
                            <option value="STUK">Stuk</option>
                            <option value="PROJECT">Project</option>
                            <option value="KM">Km</option>
                          </select>
                          {form.formState.errors.lines?.[index]?.unit && (
                            <p className="text-xs text-amber-700">
                              {form.formState.errors.lines[index]?.unit?.message}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-28 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                            {...form.register(`lines.${index}.price` as const, { valueAsNumber: true })}
                            defaultValue={field.price}
                          />
                          {form.formState.errors.lines?.[index]?.price && (
                            <p className="text-xs text-amber-700">
                              {form.formState.errors.lines[index]?.price?.message}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-24 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                            {...form.register(`lines.${index}.vat` as const)}
                            defaultValue={field.vat}
                          >
                            <option value="21">21%</option>
                            <option value="9">9%</option>
                            <option value="0">0%</option>
                          </select>
                          {form.formState.errors.lines?.[index]?.vat && (
                            <p className="text-xs text-amber-700">
                              {form.formState.errors.lines[index]?.vat?.message}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {formatBedrag(lineTotal)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            aria-label="Verwijder regel"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() =>
                  append({
                    description: "",
                    quantity: 1,
                    unit: "UUR",
                    price: 0,
                    vat: "21",
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:ring-slate-300"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Regel toevoegen
              </button>
            </div>

            <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-800 md:grid-cols-3">
              <div className="flex items-center justify-between md:col-span-2">
                <span className="font-medium">Subtotaal</span>
                <span className="font-semibold">{formatBedrag(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">BTW totaal</span>
                <span className="font-semibold">{formatBedrag(totalVat)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 md:col-span-3">
                <span className="text-base font-semibold text-slate-900">Totaal incl. BTW</span>
                <span className="text-base font-semibold text-slate-900">{formatBedrag(grandTotal)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push("/offertes")}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed"
              >
                {isPending ? "Opslaan..." : "Offerte opslaan"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
