"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { deleteTimeEntry, logTimeEntry, type TimeEntryDto } from "@/actions/time-actions";
import { CalendarDays, CheckCircle2, Clock3, Loader2, Plus, Timer, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/components/ui/export-button";

type UrenClientProps = {
  entries: TimeEntryDto[];
  totalHours: number;
};

const HOURS_GOAL = 1225;

const todayString = () => new Date().toISOString().slice(0, 10);

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function UrenClient({ entries, totalHours }: UrenClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    date: todayString(),
    hours: "0",
    description: "",
  });

  const progress = useMemo(() => Math.min((totalHours / HOURS_GOAL) * 100, 100), [totalHours]);
  const goalReached = totalHours >= HOURS_GOAL;
  const badgeVariant = goalReached ? "success" : "info";
  const progressColor = goalReached ? "bg-emerald-500" : progress >= 75 ? "bg-amber-500" : "bg-sky-500";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const normalizedHours = Number.parseFloat(formState.hours);
    const trimmedDescription = formState.description.trim();

    if (Number.isNaN(normalizedHours) || normalizedHours <= 0) {
      setFormError("Vul een positief aantal uren in.");
      return;
    }

    if (!trimmedDescription) {
      setFormError("Omschrijving is verplicht.");
      return;
    }

    startTransition(async () => {
      try {
        await logTimeEntry({
          date: formState.date,
          hours: normalizedHours,
          description: trimmedDescription,
        });

        setFormState({
          date: todayString(),
          hours: "0",
          description: "",
        });
        router.refresh();
      } catch (error) {
        console.error("Urenregistratie opslaan mislukt", error);
        setFormError("Opslaan is mislukt. Probeer het later opnieuw.");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteTimeEntry(id);
        router.refresh();
      } catch (error) {
        console.error("Verwijderen mislukt", error);
        setFormError("Verwijderen is mislukt. Probeer het later opnieuw.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-accent via-warning to-success"></div>
              <h1 className="text-3xl font-bold text-foreground">Urenregistratie</h1>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Schrijf je uren richting het 1225-criterium en houd overzicht over je voortgang.
            </p>
          </div>
          <ExportButton resource="time-entries" />
        </div>
      </div>

      <Card className="border-2 shadow-lg hover:shadow-xl hover:border-success/20 transition-all duration-300">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 p-2.5 shadow-lg ring-2 ring-accent/30">
              <Timer className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <CardTitle className="flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-accent to-success"></span>
              1225-criterium
            </CardTitle>
          </div>
          <Badge variant={badgeVariant}>
            {goalReached ? "Doel gehaald!" : `Gewerkte uren: ${totalHours.toFixed(2)} / 1225`}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Gewerkte uren: {totalHours.toFixed(2)}</span>
              <span>Doel: {HOURS_GOAL}</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border">
              <div
                className={cn("h-full rounded-full transition-all duration-300", progressColor)}
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {goalReached ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                  Geweldig! Je hebt het urencriterium gehaald.
                </>
              ) : (
                <>
                  <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Nog {Math.max(HOURS_GOAL - totalHours, 0).toFixed(2)} uur te gaan tot het criterium.
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Snel uren schrijven</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 md:grid md:grid-cols-[150px_140px_1fr_auto] md:items-center md:gap-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Datum</label>
              <input
                type="date"
                value={formState.date}
                onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Aantal uur</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={formState.hours}
                onChange={(event) => setFormState((prev) => ({ ...prev, hours: event.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Omschrijving</label>
              <input
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder="Project, klant of taak"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className={buttonVariants("primary", "h-10 min-h-0 items-center gap-2 px-4 text-sm font-semibold")}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Bezig...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Uren schrijven
                </>
              )}
            </button>
          </form>
          {formError && <p className="mt-2 text-xs text-warning">{formError}</p>}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Historie (dit jaar)</CardTitle>
          </div>
          <Badge variant="info">{entries.length} registraties</Badge>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen uren geregistreerd dit jaar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Datum</th>
                    <th className="px-3 py-2">Omschrijving</th>
                    <th className="px-3 py-2 text-right">Uren</th>
                    <th className="px-3 py-2 text-right">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/50">
                      <td className="px-3 py-3 text-muted-foreground">{formatDate(entry.date)}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-foreground">{entry.description}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-foreground">
                        {entry.hours.toFixed(2)} uur
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className={buttonVariants("destructive", "inline-flex h-auto min-h-0 items-center gap-2 px-3 py-2 text-sm font-semibold")}
                          disabled={isPending}
                          aria-label="Verwijder registratie"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Verwijder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
