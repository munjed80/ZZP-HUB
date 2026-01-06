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
import { createExpense, deleteExpense, duplicateExpense } from "./actions";
import { categories, expenseSchema, type ExpenseClientShape, type ExpenseFormValues } from "./schema";
import { type BtwTarief } from "@prisma/client";
import { CalendarClock, Euro, Loader2, PieChart, Plus, ReceiptText, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { EntityActionsMenu } from "@/components/ui/entity-actions-menu";

type UitgavenClientProps = {
  expenses: ExpenseClientShape[];
  errorMessage?: string;
  forceOpen?: boolean;
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

const COMPACT_ACTION_TRIGGER = "h-10 px-2 py-1 text-xs";

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

export function UitgavenClient({ expenses, errorMessage, forceOpen }: UitgavenClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(forceOpen));
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

  const handleDeleteExpense = (id: string) => {
    startTransition(async () => {
      const result = await deleteExpense(id);
      if (result?.success) {
        toast.success("Uitgave verwijderd");
        router.refresh();
      } else {
        toast.error(result?.message ?? "Verwijderen mislukt.");
      }
    });
  };

  const handleDuplicateExpense = (id: string) => {
    startTransition(async () => {
      const result = await duplicateExpense(id);
      if (result?.success) {
        toast.success("Uitgave gedupliceerd");
        router.refresh();
      } else {
        toast.error(result?.message ?? "Dupliceren mislukt.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-destructive via-accent to-warning"></div>
              <h1 className="text-3xl font-bold text-foreground">Uitgaven</h1>
            </div>
            <p className="text-sm text-muted-foreground font-medium pl-15">
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
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="group border-2 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 p-2.5 shadow-lg ring-2 ring-primary/30 group-hover:scale-105 transition-transform duration-300">
                <Euro className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <CardTitle>Totaal deze maand</CardTitle>
            </div>
            <Badge variant="info">Live</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatBedrag(totals.monthTotal)}</p>
            <p className="text-xs text-muted-foreground font-medium">Inclusief BTW op basis van gekozen tarieven.</p>
          </CardContent>
        </Card>

        <Card className="group border-2 hover:shadow-xl hover:border-success/20 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-gradient-to-br from-success/20 to-success/10 p-2.5 shadow-lg ring-2 ring-success/30 group-hover:scale-105 transition-transform duration-300">
                <ReceiptText className="h-5 w-5 text-success" aria-hidden />
              </div>
              <CardTitle>Te vorderen BTW</CardTitle>
            </div>
            <Badge variant="success">Recente periode</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatBedrag(totals.vatRecoverable)}</p>
            <p className="text-xs text-muted-foreground font-medium">Gebaseerd op ingevoerde uitgaven.</p>
          </CardContent>
        </Card>

        <Card className="group border-2 hover:shadow-xl hover:border-accent/20 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 p-2.5 shadow-lg ring-2 ring-accent/30 group-hover:scale-105 transition-transform duration-300">
                <PieChart className="h-5 w-5 text-accent" aria-hidden />
              </div>
              <CardTitle>Grootste kostenpost</CardTitle>
            </div>
            <Badge variant="warning">Realtime</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totals.largestCategory}</p>
            <p className="text-xs text-muted-foreground font-medium">Op basis van huidige lijst.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 p-2.5 shadow-lg ring-2 ring-border/30">
              <CalendarClock className="h-5 w-5 text-muted-foreground" aria-hidden />
            </div>
            <CardTitle className="flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-destructive to-accent"></span>
              Recente uitgaven
            </CardTitle>
          </div>
          <Badge variant="primary">{expenses.length} items</Badge>
        </CardHeader>
        <CardContent>
              {expenses.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Datum</th>
                          <th className="px-3 py-2">Omschrijving</th>
                          <th className="px-3 py-2">Categorie</th>
                          <th className="px-3 py-2 text-right">Bedrag (excl.)</th>
                          <th className="px-3 py-2 text-right">BTW</th>
                          <th className="px-3 py-2 text-right">Totaal</th>
                          <th className="px-3 py-2 text-right">Acties</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {expenses.map((expense) => {
                          const { vatAmount, total } = calculateExpenseAmounts(expense);
                          return (
                            <tr key={expense.id} className="hover:bg-muted/60">
                              <td className="px-3 py-3 text-muted-foreground">{formatDate(expense.date)}</td>
                              <td className="px-3 py-3">
                                <div className="font-medium text-foreground">{expense.description}</div>
                                {expense.receiptUrl && (
                                  <a
                                    href={expense.receiptUrl}
                                    className="text-xs text-accent underline"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Bonnetje
                                  </a>
                                )}
                              </td>
                              <td className="px-3 py-3 text-muted-foreground">{expense.category}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-foreground">
                                {formatBedrag(expense.amountExcl)}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                                {vatLabels[expense.vatRate]} ({formatBedrag(vatAmount)})
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums font-semibold text-foreground">
                                {formatBedrag(total)}
                              </td>
                              <td className="px-3 py-3 text-right">
                                <EntityActionsMenu
                                  title="Uitgave acties"
                                  description={expense.description}
                                  triggerClassName={COMPACT_ACTION_TRIGGER}
                                >
                              <div className="space-y-2 p-2">
                                {expense.receiptUrl ? (
                                  <a
                                    href={expense.receiptUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-left text-sm text-sky-700"
                                  >
                                    Bonnetje bekijken
                                  </a>
                                ) : null}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="w-full justify-start gap-2"
                                  onClick={() => handleDuplicateExpense(expense.id)}
                                  disabled={isPending}
                                >
                                  Dupliceer
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="w-full justify-start gap-2"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  disabled={isPending}
                                >
                                  Verwijder
                                </Button>
                              </div>
                            </EntityActionsMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-muted/80">
                        <tr>
                          <td className="px-3 py-3 text-sm font-semibold text-muted-foreground" colSpan={5}>
                            Totaal huidige lijst
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">
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
                      className="rounded-lg border border-border bg-muted p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">{expense.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(expense.date)}</p>
                          </div>
                          <span className="ml-2">
                            <Badge variant="muted">{expense.category}</Badge>
                          </span>
                        </div>
                        <div className="flex justify-end">
                          <EntityActionsMenu
                            title="Uitgave acties"
                            description={expense.description}
                            triggerClassName={COMPACT_ACTION_TRIGGER}
                          >
                            <div className="space-y-2 p-2">
                              {expense.receiptUrl ? (
                                <a
                                  href={expense.receiptUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-left text-sm text-sky-700"
                                >
                                  Bonnetje bekijken
                                </a>
                              ) : null}
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start gap-2"
                                onClick={() => handleDuplicateExpense(expense.id)}
                                disabled={isPending}
                              >
                                Dupliceer
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start gap-2"
                                onClick={() => handleDeleteExpense(expense.id)}
                                disabled={isPending}
                              >
                                Verwijder
                              </Button>
                            </div>
                          </EntityActionsMenu>
                        </div>
                      {expense.receiptUrl && (
                        <a
                          href={expense.receiptUrl}
                          className="text-xs text-accent underline inline-block mb-2"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Bonnetje bekijken
                        </a>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border text-xs">
                        <div>
                          <span className="text-muted-foreground">Excl. BTW:</span>
                          <p className="font-semibold text-foreground">{formatBedrag(expense.amountExcl)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">BTW ({vatLabels[expense.vatRate]}):</span>
                          <p className="font-semibold text-foreground">{formatBedrag(vatAmount)}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Totaal:</span>
                        <span className="text-lg font-bold text-foreground">{formatBedrag(total)}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-lg bg-muted p-3 flex items-center justify-between border border-border">
                  <span className="text-sm font-semibold text-muted-foreground">Totaal lijst:</span>
                  <span className="text-lg font-bold text-foreground">{formatBedrag(totals.pageTotal)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Nieuwe uitgave</h2>
                <p className="text-sm text-muted-foreground">
                  Vul de kosten in. Je kunt een bedrag incl. of excl. BTW invoeren, de ander wordt berekend.
                </p>
              </div>
              <Button type="button" variant="ghost" className="px-3 py-2" onClick={() => setOpen(false)}>
                Sluiten
              </Button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Omschrijving</label>
                <input
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Softwarelicentie, kantoorartikelen..."
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-warning-foreground">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Categorie</label>
                <select
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  {...form.register("category")}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {form.formState.errors.category && (
                  <p className="text-xs text-warning-foreground">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Datum</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  {...form.register("date")}
                />
                {form.formState.errors.date && (
                  <p className="text-xs text-warning-foreground">{form.formState.errors.date.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Bedrag excl. BTW</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  {...form.register("amountExcl", { valueAsNumber: true })}
                />
                {form.formState.errors.amountExcl && (
                  <p className="text-xs text-warning-foreground">{form.formState.errors.amountExcl.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Bedrag incl. BTW</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountInclDisplay}
                  onChange={(event) => handleAmountInclChange(event.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Wordt berekend"
                />
                <p className="text-xs text-muted-foreground">Automatische koppeling met gekozen BTW-tarief.</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">BTW tarief</label>
                <select
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  {...form.register("vatRate")}
                >
                  <option value="HOOG_21">21%</option>
                  <option value="LAAG_9">9%</option>
                  <option value="NUL_0">0%</option>
                  <option value="VRIJGESTELD">Vrijgesteld</option>
                  <option value="VERLEGD">Verlegd</option>
                </select>
                {form.formState.errors.vatRate && (
                  <p className="text-xs text-warning-foreground">{form.formState.errors.vatRate.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Bonnetje uploaden</label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:border-primary/40">
                  <UploadCloud className="h-5 w-5 text-muted-foreground" aria-hidden />
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Sleep je bonnetje hierheen of kies bestand</p>
                    <p className="text-xs text-muted-foreground">{RECEIPT_UPLOAD_NOTE}</p>
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
                {selectedFile && <p className="text-xs text-muted-foreground">Gekozen bestand: {selectedFile}</p>}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Link naar bonnetje (optioneel)</label>
                <input
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="https://..."
                  {...form.register("receiptUrl")}
                />
                {form.formState.errors.receiptUrl && (
                  <p className="text-xs text-warning-foreground">{form.formState.errors.receiptUrl.message}</p>
                )}
              </div>

              {formError && <p className="text-xs text-warning-foreground md:col-span-2">{formError}</p>}

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
