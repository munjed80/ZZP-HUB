"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { createInvoice, updateInvoice } from "../actions";
import { INVOICE_LINE_UNITS, invoiceSchema, type InvoiceFormValues } from "../schema";

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

type InvoiceFormProps = {
  clients: Client[];
  initialInvoice?: InvoiceFormValues;
  initialClientName?: string;
  mode?: "create" | "edit";
  invoiceId?: string;
  korEnabled?: boolean;
};

const unitLabels: Record<(typeof INVOICE_LINE_UNITS)[number], string> = {
  UUR: "Uur",
  STUK: "Stuk",
  PROJECT: "Project",
  KM: "Km",
  LICENTIE: "Licentie",
  STOP: "Stop",
};

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `draft-${year}-${suffix}`;
}

export function InvoiceForm({
  clients,
  initialInvoice,
  initialClientName,
  mode = "create",
  invoiceId,
  korEnabled = false,
}: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = useMemo(() => new Date(), []);
  const defaultDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  }, []);

  const defaultFormValues: InvoiceFormValues = useMemo(
    () =>
      initialInvoice ?? {
        clientId: clients[0]?.id ?? "",
        invoiceNum: generateInvoiceNumber(),
        date: formatDateInput(today),
        dueDate: formatDateInput(defaultDueDate),
        lines: [
          {
            description: "",
            quantity: 1,
            unit: "UUR",
            price: 0,
            vat: korEnabled ? "0" : "21",
          },
        ],
      },
    [clients, defaultDueDate, initialInvoice, korEnabled, today],
  );

  const [searchTerm, setSearchTerm] = useState(
    () => initialClientName ?? "",
  );
  const [openList, setOpenList] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultFormValues,
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
        if (mode === "edit" && invoiceId) {
          await updateInvoice(invoiceId, values);
          toast.success("Factuur succesvol bijgewerkt!");
          router.push(`/facturen/${invoiceId}`);
        } else {
          const invoice = await createInvoice(values);
          toast.success("Factuur succesvol aangemaakt!");
          router.push(`/facturen/${invoice.id}/edit`);
        }
      } catch (error) {
        console.error("Factuur opslaan mislukt", error);
        toast.error("Factuur opslaan mislukt. Probeer het opnieuw.");
      }
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          {mode === "edit" ? "Factuur bewerken" : "Nieuwe factuur"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Koppel een relatie, vul factuurregels in en bewaar als concept. Klantadres en BTW-gegevens worden direct ingevuld.
        </p>
      </div>

      <Card className="bg-card">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Factuurgegevens</CardTitle>
          <Badge variant="info">Concept</Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Factuurnummer</label>
              <input
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                {...form.register("invoiceNum")}
                placeholder="draft-2025-001"
              />
              {form.formState.errors.invoiceNum && (
                <p className="text-xs text-warning">{form.formState.errors.invoiceNum.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Factuurdatum</label>
              <input
                type="date"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <p className="text-xs text-warning">{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Vervaldatum</label>
              <input
                type="date"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                {...form.register("dueDate")}
              />
              {form.formState.errors.dueDate && (
                <p className="text-xs text-warning">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Relatie</label>
            <div className="relative">
              <input
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder="Zoek op naam, e-mail of stad"
                value={searchTerm}
                onFocus={() => setOpenList(true)}
                onBlur={() => setTimeout(() => setOpenList(false), 100)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setOpenList(true);
                  if (e.target.value === "") {
                    form.setValue("clientId", "");
                  }
                }}
              />
              {openList && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                  {filteredClients.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Geen matches gevonden.</p>
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
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <div className="font-semibold text-foreground">{client.name}</div>
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.formState.errors.clientId && (
              <p className="text-xs text-warning">{form.formState.errors.clientId.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Relatie adres</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {selectedClient ? (
                  <>
                    <p className="font-semibold text-foreground">{selectedClient.name}</p>
                    <p>{selectedClient.address}</p>
                    <p>
                      {selectedClient.postalCode} {selectedClient.city}
                    </p>
                    <p className="text-xs text-muted-foreground">KVK: {selectedClient.kvkNumber || "—"}</p>
                    <p className="text-xs text-muted-foreground">BTW-id: {selectedClient.btwId || "—"}</p>
                  </>
                ) : (
                  <p className="italic text-muted-foreground">Selecteer een relatie om adresgegevens te tonen.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Betaalstatus</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Conceptfactuur. Aanpassen van vervaldatum en BTW per regel wordt ondersteund.</p>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
              <tbody className="divide-y divide-border">
                {fields.map((field, index) => {
                  const lineTotal = (Number(watchedLines[index]?.quantity) || 0) * (Number(watchedLines[index]?.price) || 0);

                  return (
                    <tr key={field.id} className="align-top">
                      <td className="px-3 py-2">
                        <input
                          className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                          placeholder="Omschrijving"
                          {...form.register(`lines.${index}.description` as const)}
                          defaultValue={field.description}
                        />
                        {form.formState.errors.lines?.[index]?.description && (
                          <p className="text-xs text-warning">
                            {form.formState.errors.lines[index]?.description?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 rounded-lg border border-input bg-background px-2 py-2 text-sm text-foreground"
                          {...form.register(`lines.${index}.quantity` as const, { valueAsNumber: true })}
                          defaultValue={field.quantity}
                        />
                        {form.formState.errors.lines?.[index]?.quantity && (
                          <p className="text-xs text-warning">
                            {form.formState.errors.lines[index]?.quantity?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                         <select
                           className="w-28 rounded-lg border border-input bg-background px-2 py-2 text-sm text-foreground"
                           {...form.register(`lines.${index}.unit` as const)}
                           defaultValue={field.unit}
                         >
                          {INVOICE_LINE_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unitLabels[unit]}
                            </option>
                          ))}
                         </select>
                        {form.formState.errors.lines?.[index]?.unit && (
                          <p className="text-xs text-warning">
                            {form.formState.errors.lines[index]?.unit?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-28 rounded-lg border border-input bg-background px-2 py-2 text-sm text-foreground"
                          {...form.register(`lines.${index}.price` as const, { valueAsNumber: true })}
                          defaultValue={field.price}
                        />
                        {form.formState.errors.lines?.[index]?.price && (
                          <p className="text-xs text-warning">
                            {form.formState.errors.lines[index]?.price?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="w-24 rounded-lg border border-input bg-background px-2 py-2 text-sm text-foreground"
                          {...form.register(`lines.${index}.vat` as const)}
                          defaultValue={field.vat}
                        >
                          <option value="21">21%</option>
                          <option value="9">9%</option>
                          <option value="0">0%</option>
                        </select>
                        {form.formState.errors.lines?.[index]?.vat && (
                          <p className="text-xs text-warning">
                            {form.formState.errors.lines[index]?.vat?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-foreground">
                        {formatBedrag(lineTotal)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
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
            <Button
              type="button"
              variant="secondary"
          onClick={() =>
            append({
              description: "",
              quantity: 1,
              unit: "UUR",
              price: 0,
              vat: korEnabled ? "0" : "21",
            })
          }
              className="px-3"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Regel toevoegen
            </Button>
          </div>

          <div className="grid gap-3 rounded-lg bg-muted p-4 text-sm text-foreground md:grid-cols-3">
            <div className="flex items-center justify-between md:col-span-2">
              <span className="font-medium">Subtotaal</span>
              <span className="font-semibold">{formatBedrag(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">BTW totaal</span>
              <span className="font-semibold">{formatBedrag(totalVat)}</span>
            </div>
            <div className="flex items-center justify-between md:col-span-3 border-t border-border pt-3">
              <span className="text-base font-semibold text-foreground">Totaal incl. BTW</span>
              <span className="text-base font-semibold text-foreground">{formatBedrag(grandTotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => router.push("/facturen")}>
              Annuleren
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Opslaan..." : mode === "edit" ? "Factuur bijwerken" : "Factuur opslaan"}
            </Button>
          </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
