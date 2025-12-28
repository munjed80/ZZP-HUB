"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteTimeEntry, logTimeEntry, type TimeEntryDto } from "@/actions/time-actions";
import { CalendarDays, CheckCircle2, Clock3, Loader2, Plus, Timer, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <h1 className="text-2xl font-bold text-slate-900">Urenregistratie</h1>
        <p className="text-sm text-slate-600">
          Schrijf je uren richting het 1225-criterium en houd overzicht over je voortgang.
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-slate-500" aria-hidden />
            <CardTitle>1225-criterium</CardTitle>
          </div>
          <Badge variant={goalReached ? "success" : "info"}>
            {goalReached ? "Doel gehaald!" : "Gewerkte uren: " + totalHours.toFixed(2) + " / 1225"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Gewerkte uren: {totalHours.toFixed(2)}</span>
              <span>Doel: {HOURS_GOAL}</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">
              <div
                className={cn("h-full rounded-full transition-all duration-300", progressColor)}
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {goalReached ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                  Geweldig! Je hebt het urencriterium gehaald.
                </>
              ) : (
                <>
                  <Clock3 className="h-4 w-4 text-sky-600" aria-hidden />
                  Nog {Math.max(HOURS_GOAL - totalHours, 0).toFixed(2)} uur te gaan tot het criterium.
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden />
            <CardTitle>Snel uren schrijven</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 md:grid md:grid-cols-[150px_140px_1fr_auto] md:items-center md:gap-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Datum</label>
              <input
                type="date"
                value={formState.date}
                onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Aantal uur</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={formState.hours}
                onChange={(event) => setFormState((prev) => ({ ...prev, hours: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Omschrijving</label>
              <input
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Project, klant of taak"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Bezig...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden />
                  Uren schrijven
                </>
              )}
            </button>
          </form>
          {formError && <p className="mt-2 text-xs text-amber-700">{formError}</p>}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden />
            <CardTitle>Historie (dit jaar)</CardTitle>
          </div>
          <Badge variant="info">{entries.length} registraties</Badge>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-slate-600">Nog geen uren geregistreerd dit jaar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Datum</th>
                    <th className="px-3 py-2">Omschrijving</th>
                    <th className="px-3 py-2 text-right">Uren</th>
                    <th className="px-3 py-2 text-right">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 text-slate-700">{formatDate(entry.date)}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{entry.description}</div>
                        <p className="text-xs text-slate-500">{entry.date}</p>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">
                        {entry.hours.toFixed(2)} uur
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed"
                          disabled={isPending}
                          aria-label="Verwijder registratie"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
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
