"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBedrag } from "@/lib/utils";
import { createExpense } from "./actions";
import { categories, expenseSchema, type ExpenseClientShape, type ExpenseFormValues } from "./schema";
import { type BtwTarief } from "@prisma/client";
import { CalendarClock, Euro, Loader2, PieChart, Plus, ReceiptText, UploadCloud } from "lucide-react";
import { toast } from "sonner";

type UitgavenClientProps = {
  expenses: ExpenseClientShape[];
  errorMessage?: string;
};

const vatPercentages: Record<BtwTarief, number> = {
  HOOG_21: 0.21,
  LAAG_9: 0.09,
  NUL_0: 0,
  VRIJGESTELD: 0,
  VERLEGD: 0,
};

const vatLabels: Record<BtwTarief, string> = {
  HOOG_21: "21%",
  LAAG_9: "9%",
  NUL_0: "0%",
  VRIJGESTELD: "Vrijgesteld",
  VERLEGD: "Verlegd",
};

// Rounding factor for currency values (100 = 10^2 for two decimals)
const CURRENCY_ROUNDING_FACTOR = 100;
const RECEIPT_UPLOAD_NOTE = "Upload integratie volgt; we tonen nu alleen de bestandsnaam.";

const defaultFormValues = (): ExpenseFormValues => ({
  description: "",
  category: categories[0],
  amountExcl: 0,
  vatRate: "HOOG_21",
  date: new Date().toISOString().slice(0, 10),
  receiptUrl: "",
});

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function calculateExpenseAmounts(expense: Pick<ExpenseClientShape, "amountExcl" | "vatRate">) {
  const vatRate = vatPercentages[expense.vatRate] ?? 0;
  const vatAmount = expense.amountExcl * vatRate;
  const total = expense.amountExcl + vatAmount;
  return { vatAmount, total };
}

function getLargestCategory(categoryTotals: Record<string, number>) {
  if (Object.keys(categoryTotals).length === 0) {
    return "Geen uitgaven";
  }

  return Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Nog niets";
}

export function UitgavenClient({ expenses, errorMessage }: UitgavenClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultFormValues(),
  });

  const amountExcl = useWatch({ control: form.control, name: "amountExcl" });
  const vatRate = useWatch({ control: form.control, name: "vatRate" });
  const vatPercentage = vatPercentages[vatRate ?? "HOOG_21"];

  const amountInclDisplay =
    typeof amountExcl === "number" && !Number.isNaN(amountExcl)
      ? (amountExcl * (1 + vatPercentage)).toFixed(2)
      : "";

  const handleAmountInclChange = (value: string) => {
    const normalizedValue = value.replace(/\s/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalizedValue);
    const targetValue = Number.isNaN(parsed) ? Number.NaN : parsed;
    const excl = Number.isNaN(targetValue)
      ? Number.NaN
      : vatPercentage === 0
        ? targetValue
        : targetValue / (1 + vatPercentage);

    const roundedExcl = Number.isNaN(excl)
      ? 0
      : Math.round(excl * CURRENCY_ROUNDING_FACTOR) / CURRENCY_ROUNDING_FACTOR;

    form.setValue("amountExcl", roundedExcl, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const totals = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let monthTotal = 0;
    let vatRecoverable = 0;
    let pageTotal = 0;
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((expense) => {
      const { vatAmount, total } = calculateExpenseAmounts(expense);
      pageTotal += total;
      vatRecoverable += vatAmount;

      const expenseDate = new Date(expense.date);
      if (expenseDate >= startOfMonth) {
        monthTotal += total;
      }

      categoryTotals[expense.category] = (categoryTotals[expense.category] ?? 0) + total;
    });

    const largestCategory = getLargestCategory(categoryTotals);

    return { monthTotal, vatRecoverable, pageTotal, largestCategory };
  }, [expenses]);

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      try {
        await createExpense(values);
        form.reset(defaultFormValues());
        setSelectedFile(null);
        setOpen(false);
        router.refresh();
        toast.success("Uitgave succesvol opgeslagen!");
      } catch (error) {
        console.error("Uitgave opslaan mislukt", error);
        setFormError("Opslaan van uitgave is mislukt. Probeer het later opnieuw.");
        toast.error("Opslaan van uitgave is mislukt.");
      }
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Uitgaven</h1>
            <p className="text-sm text-slate-600">
              Registreer kosten, bereken BTW automatisch en bewaar een link naar je bonnetjes.
            </p>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nieuwe uitgave
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-slate-500" aria-hidden />
              <CardTitle>Totaal deze maand</CardTitle>
            </div>
            <Badge variant="info">Live</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatBedrag(totals.monthTotal)}</p>
            <p className="text-xs text-slate-500">Inclusief BTW op basis van gekozen tarieven.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-slate-500" aria-hidden />
              <CardTitle>Te vorderen BTW</CardTitle>
            </div>
            <Badge variant="success">Recente periode</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{formatBedrag(totals.vatRecoverable)}</p>
            <p className="text-xs text-slate-500">Gebaseerd op ingevoerde uitgaven.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-slate-500" aria-hidden />
              <CardTitle>Grootste kostenpost</CardTitle>
            </div>
            <Badge variant="warning">Realtime</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{totals.largestCategory}</p>
            <p className="text-xs text-slate-500">Op basis van huidige lijst.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-slate-500" aria-hidden />
            <CardTitle>Recente uitgaven</CardTitle>
          </div>
          <Badge variant="info">{expenses.length} items</Badge>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Datum</th>
                      <th className="px-3 py-2">Omschrijving</th>
                      <th className="px-3 py-2">Categorie</th>
                      <th className="px-3 py-2 text-right">Bedrag (excl.)</th>
                      <th className="px-3 py-2 text-right">BTW</th>
                      <th className="px-3 py-2 text-right">Totaal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {expenses.map((expense) => {
                      const { vatAmount, total } = calculateExpenseAmounts(expense);
                      return (
                        <tr key={expense.id} className="hover:bg-slate-50">
                          <td className="px-3 py-3 text-slate-700">{formatDate(expense.date)}</td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-slate-900">{expense.description}</div>
                            {expense.receiptUrl && (
                              <a
                                href={expense.receiptUrl}
                                className="text-xs text-sky-600 underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Bonnetje
                              </a>
                            )}
                          </td>
                          <td className="px-3 py-3 text-slate-700">{expense.category}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-slate-900">
                            {formatBedrag(expense.amountExcl)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                            {vatLabels[expense.vatRate]} ({formatBedrag(vatAmount)})
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">
                            {formatBedrag(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td className="px-3 py-3 text-sm font-semibold text-slate-700" colSpan={5}>
                        Totaal huidige lijst
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-slate-900">
                        {formatBedrag(totals.pageTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {expenses.map((expense) => {
                  const { vatAmount, total } = calculateExpenseAmounts(expense);
                  return (
                    <div
                      key={expense.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{expense.description}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatDate(expense.date)}</p>
                        </div>
                        <span className="ml-2">
                          <Badge variant="muted">{expense.category}</Badge>
                        </span>
                      </div>
                      {expense.receiptUrl && (
                        <a
                          href={expense.receiptUrl}
                          className="text-xs text-sky-600 underline inline-block mb-2"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Bonnetje bekijken
                        </a>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-600">Excl. BTW:</span>
                          <p className="font-semibold text-slate-900">{formatBedrag(expense.amountExcl)}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">BTW ({vatLabels[expense.vatRate]}):</span>
                          <p className="font-semibold text-slate-900">{formatBedrag(vatAmount)}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Totaal:</span>
                        <span className="text-lg font-bold text-slate-900">{formatBedrag(total)}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-lg bg-slate-100 p-3 flex items-center justify-between border border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Totaal lijst:</span>
                  <span className="text-lg font-bold text-slate-900">{formatBedrag(totals.pageTotal)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Nieuwe uitgave</h2>
                <p className="text-sm text-slate-600">
                  Vul de kosten in. Je kunt een bedrag incl. of excl. BTW invoeren, de ander wordt berekend.
                </p>
              </div>
              <Button type="button" variant="ghost" className="px-3 py-2" onClick={() => setOpen(false)}>
                Sluiten
              </Button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-800">Omschrijving</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Softwarelicentie, kantoorartikelen..."
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-amber-700">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Categorie</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  {...form.register("category")}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {form.formState.errors.category && (
                  <p className="text-xs text-amber-700">{form.formState.errors.category.message}</p>
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
                <label className="text-sm font-medium text-slate-800">Bedrag excl. BTW</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  {...form.register("amountExcl", { valueAsNumber: true })}
                />
                {form.formState.errors.amountExcl && (
                  <p className="text-xs text-amber-700">{form.formState.errors.amountExcl.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">Bedrag incl. BTW</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountInclDisplay}
                  onChange={(event) => handleAmountInclChange(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Wordt berekend"
                />
                <p className="text-xs text-slate-500">Automatische koppeling met gekozen BTW-tarief.</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">BTW tarief</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  {...form.register("vatRate")}
                >
                  <option value="HOOG_21">21%</option>
                  <option value="LAAG_9">9%</option>
                  <option value="NUL_0">0%</option>
                  <option value="VRIJGESTELD">Vrijgesteld</option>
                  <option value="VERLEGD">Verlegd</option>
                </select>
                {form.formState.errors.vatRate && (
                  <p className="text-xs text-amber-700">{form.formState.errors.vatRate.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-800">Bonnetje uploaden</label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-6 text-sm text-slate-600 hover:border-slate-300">
                  <UploadCloud className="h-5 w-5 text-slate-500" aria-hidden />
                  <div className="text-center">
                    <p className="font-semibold text-slate-800">Sleep je bonnetje hierheen of kies bestand</p>
                    <p className="text-xs text-slate-500">{RECEIPT_UPLOAD_NOTE}</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        setSelectedFile(file.name);
                      }
                    }}
                  />
                </label>
                {selectedFile && <p className="text-xs text-slate-600">Gekozen bestand: {selectedFile}</p>}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-800">Link naar bonnetje (optioneel)</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="https://..."
                  {...form.register("receiptUrl")}
                />
                {form.formState.errors.receiptUrl && (
                  <p className="text-xs text-amber-700">{form.formState.errors.receiptUrl.message}</p>
                )}
              </div>

              {formError && <p className="text-xs text-amber-700 md:col-span-2">{formError}</p>}

              <div className="flex items-center gap-3 md:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" aria-hidden />
                      Uitgave opslaan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
