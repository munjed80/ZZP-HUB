"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  deleteTimeEntry,
  logTimeEntry,
  updateTimeEntry,
  type TimeEntryDto,
  type WeekSummary,
} from "@/actions/time-actions";
import { WORK_TYPES, calculateHoursFromTimes, isTimeAfter, isBreakValid } from "@/lib/time-constants";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Clock3,
  Coffee,
  Edit2,
  Loader2,
  Plus,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/components/ui/export-button";

type UrenClientProps = {
  entries: TimeEntryDto[];
  totalHours: number;
  weekSummaries: WeekSummary[];
  canEdit: boolean;
  canExport: boolean;
};

const HOURS_GOAL = 1225;

const todayString = () => new Date().toISOString().slice(0, 10);
const currentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateShort(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "numeric",
  }).format(date);
}

type FormState = {
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  description: string;
  workType: string;
  notes: string;
  useTimeRange: boolean;
  manualHours: string;
};

const initialFormState = (): FormState => ({
  date: todayString(),
  startTime: "09:00",
  endTime: currentTime(),
  breakMinutes: "0",
  description: "",
  workType: "Project",
  notes: "",
  useTimeRange: true,
  manualHours: "0",
});

export function UrenClient({ entries, totalHours, weekSummaries, canEdit, canExport }: UrenClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [editingEntry, setEditingEntry] = useState<TimeEntryDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"entries" | "weeks">("entries");

  const progress = useMemo(() => Math.min((totalHours / HOURS_GOAL) * 100, 100), [totalHours]);
  const goalReached = totalHours >= HOURS_GOAL;
  const badgeVariant = goalReached ? "success" : "info";
  const progressColor = goalReached ? "bg-emerald-500" : progress >= 75 ? "bg-amber-500" : "bg-sky-500";

  // Calculate hours for display
  const calculatedHours = useMemo(() => {
    if (!formState.useTimeRange) {
      return Number.parseFloat(formState.manualHours) || 0;
    }
    if (formState.startTime && formState.endTime) {
      return calculateHoursFromTimes(
        formState.startTime,
        formState.endTime,
        Number.parseInt(formState.breakMinutes) || 0
      );
    }
    return 0;
  }, [formState.useTimeRange, formState.startTime, formState.endTime, formState.breakMinutes, formState.manualHours]);

  const openEditForm = (entry: TimeEntryDto) => {
    setEditingEntry(entry);
    setFormState({
      date: entry.date,
      startTime: entry.startTime || "09:00",
      endTime: entry.endTime || "17:00",
      breakMinutes: String(entry.breakMinutes || 0),
      description: entry.description,
      workType: entry.workType || "Project",
      notes: entry.notes || "",
      useTimeRange: Boolean(entry.startTime && entry.endTime),
      manualHours: String(entry.hours),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormState(initialFormState());
    setEditingEntry(null);
    setShowForm(false);
    setFormError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedDescription = formState.description.trim();
    if (!trimmedDescription) {
      setFormError("Omschrijving is verplicht.");
      return;
    }

    // Validation using shared utility functions
    if (formState.useTimeRange) {
      if (!formState.startTime || !formState.endTime) {
        setFormError("Vul start- en eindtijd in.");
        return;
      }
      if (!isTimeAfter(formState.startTime, formState.endTime)) {
        setFormError("Eindtijd moet na starttijd liggen.");
        return;
      }
      const breakMins = Number.parseInt(formState.breakMinutes) || 0;
      if (!isBreakValid(formState.startTime, formState.endTime, breakMins)) {
        setFormError("Pauze kan niet langer zijn dan de gewerkte periode.");
        return;
      }
    } else {
      const hours = Number.parseFloat(formState.manualHours);
      if (Number.isNaN(hours) || hours <= 0) {
        setFormError("Vul een positief aantal uren in.");
        return;
      }
    }

    startTransition(async () => {
      try {
        const payload = {
          date: formState.date,
          hours: calculatedHours,
          description: trimmedDescription,
          startTime: formState.useTimeRange ? formState.startTime : undefined,
          endTime: formState.useTimeRange ? formState.endTime : undefined,
          breakMinutes: formState.useTimeRange ? Number.parseInt(formState.breakMinutes) || 0 : undefined,
          workType: formState.workType || undefined,
          notes: formState.notes.trim() || undefined,
        };

        if (editingEntry) {
          await updateTimeEntry(editingEntry.id, payload);
        } else {
          await logTimeEntry(payload);
        }

        resetForm();
        router.refresh();
      } catch (error) {
        console.error("Urenregistratie opslaan mislukt", error);
        setFormError("Opslaan is mislukt. Probeer het later opnieuw.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!canEdit) return;
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
          <div className="flex items-center gap-2">
            {canExport && <ExportButton resource="time-entries" />}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditingEntry(null);
                  setFormState(initialFormState());
                  setShowForm(true);
                }}
                className={buttonVariants("primary", "inline-flex items-center gap-2")}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Uren schrijven
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1225 Criterion Progress Card */}
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

      {/* Tabs for switching between entries and week view */}
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("entries")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "entries"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays className="h-4 w-4 inline-block mr-2" />
          Registraties
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("weeks")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "weeks"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="h-4 w-4 inline-block mr-2" />
          Weekoverzicht
        </button>
      </div>

      {/* Entries Tab */}
      {activeTab === "entries" && (
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Registraties (dit jaar)</CardTitle>
            </div>
            <Badge variant="info">{entries.length} registraties</Badge>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen uren geregistreerd dit jaar.</p>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Datum</th>
                        <th className="px-3 py-2">Tijden</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Omschrijving</th>
                        <th className="px-3 py-2 text-right">Uren</th>
                        {canEdit && <th className="px-3 py-2 text-right">Acties</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-muted/50">
                          <td className="px-3 py-3 text-muted-foreground">{formatDate(entry.date)}</td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {entry.startTime && entry.endTime ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {entry.startTime} - {entry.endTime}
                                {entry.breakMinutes ? (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    <Coffee className="h-3 w-3 inline" /> {entry.breakMinutes}m
                                  </span>
                                ) : null}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {entry.workType ? (
                              <Badge variant="muted">{entry.workType}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-foreground">{entry.description}</div>
                            {entry.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                                {entry.notes}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-semibold text-foreground">
                            {entry.hours.toFixed(2)} uur
                          </td>
                          {canEdit && (
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditForm(entry)}
                                  className={buttonVariants("outline", "h-8 px-2 text-xs")}
                                  disabled={isPending}
                                  aria-label="Bewerk registratie"
                                >
                                  <Edit2 className="h-3 w-3" aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(entry.id)}
                                  className={buttonVariants("destructive", "h-8 px-2 text-xs")}
                                  disabled={isPending}
                                  aria-label="Verwijder registratie"
                                >
                                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-border bg-muted p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground">{entry.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(entry.date)}</p>
                        </div>
                        <span className="text-lg font-bold text-foreground">{entry.hours.toFixed(2)}u</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
                        {entry.startTime && entry.endTime && (
                          <span className="flex items-center gap-1 bg-card px-2 py-1 rounded">
                            <Clock className="h-3 w-3" />
                            {entry.startTime} - {entry.endTime}
                          </span>
                        )}
                        {entry.breakMinutes ? (
                          <span className="flex items-center gap-1 bg-card px-2 py-1 rounded">
                            <Coffee className="h-3 w-3" />
                            {entry.breakMinutes}m pauze
                          </span>
                        ) : null}
                        {entry.workType && (
                          <Badge variant="muted">{entry.workType}</Badge>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                          {entry.notes}
                        </p>
                      )}
                      {canEdit && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                          <button
                            type="button"
                            onClick={() => openEditForm(entry)}
                            className={buttonVariants("outline", "flex-1 h-9 text-xs")}
                            disabled={isPending}
                          >
                            <Edit2 className="h-3 w-3 mr-1" aria-hidden="true" />
                            Bewerken
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className={buttonVariants("destructive", "flex-1 h-9 text-xs")}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3 w-3 mr-1" aria-hidden="true" />
                            Verwijderen
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Week Summary Tab */}
      {activeTab === "weeks" && (
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Weekoverzicht</CardTitle>
            </div>
            <Badge variant="info">{weekSummaries.length} weken</Badge>
          </CardHeader>
          <CardContent>
            {weekSummaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen uren geregistreerd dit jaar.</p>
            ) : (
              <div className="space-y-4">
                {weekSummaries.slice(0, 10).map((week) => (
                  <div
                    key={`${week.year}-W${week.weekNumber}`}
                    className="rounded-lg border border-border bg-muted p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Week {week.weekNumber}, {week.year}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        {week.totalHours.toFixed(2)} uur
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Object.entries(week.dayTotals)
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(([date, hours]) => (
                          <div
                            key={date}
                            className="text-center p-2 rounded bg-card border border-border"
                          >
                            <p className="text-xs text-muted-foreground">{formatDateShort(date)}</p>
                            <p className="text-sm font-semibold text-foreground">{hours.toFixed(1)}u</p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-sm">
          <div className="flex min-h-full items-end justify-center p-3 sm:items-center">
            <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {editingEntry ? "Uren bewerken" : "Uren schrijven"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Vul de gewerkte tijd in voor de dag
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted transition"
                  aria-label="Sluiten"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-4">
                {/* Date */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Datum</label>
                  <input
                    type="date"
                    value={formState.date}
                    onChange={(e) => setFormState((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    required
                  />
                </div>

                {/* Time Entry Mode Toggle */}
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.useTimeRange}
                      onChange={(e) => setFormState((prev) => ({ ...prev, useTimeRange: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {formState.useTimeRange ? "Start- en eindtijd invoeren" : "Uren handmatig invoeren"}
                  </span>
                </div>

                {formState.useTimeRange ? (
                  <>
                    {/* Start/End Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Starttijd</label>
                        <input
                          type="time"
                          value={formState.startTime}
                          onChange={(e) => setFormState((prev) => ({ ...prev, startTime: e.target.value }))}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Eindtijd</label>
                        <input
                          type="time"
                          value={formState.endTime}
                          onChange={(e) => setFormState((prev) => ({ ...prev, endTime: e.target.value }))}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                          required
                        />
                      </div>
                    </div>

                    {/* Break */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-muted-foreground" />
                        Pauze (minuten)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={formState.breakMinutes}
                        onChange={(e) => setFormState((prev) => ({ ...prev, breakMinutes: e.target.value }))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                        placeholder="0"
                      />
                    </div>
                  </>
                ) : (
                  /* Manual Hours */
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Aantal uren</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={formState.manualHours}
                      onChange={(e) => setFormState((prev) => ({ ...prev, manualHours: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="0.00"
                      required
                    />
                  </div>
                )}

                {/* Calculated Hours Display */}
                <div className="rounded-lg bg-muted p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Berekende uren:</span>
                  <span className="text-lg font-bold text-foreground">{calculatedHours.toFixed(2)} uur</span>
                </div>

                {/* Work Type */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Werktype</label>
                  <select
                    value={formState.workType}
                    onChange={(e) => setFormState((prev) => ({ ...prev, workType: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {WORK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Omschrijving *</label>
                  <input
                    type="text"
                    value={formState.description}
                    onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Bijv. Website ontwikkeling klant X"
                    required
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Notities (optioneel)</label>
                  <textarea
                    value={formState.notes}
                    onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[80px]"
                    placeholder="Extra informatie over de werkzaamheden..."
                  />
                </div>

                {formError && <p className="text-sm text-destructive">{formError}</p>}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className={buttonVariants("outline", "flex-1")}
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className={buttonVariants("primary", "flex-1 inline-flex items-center justify-center gap-2")}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Opslaan...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" aria-hidden />
                        {editingEntry ? "Opslaan" : "Uren opslaan"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
