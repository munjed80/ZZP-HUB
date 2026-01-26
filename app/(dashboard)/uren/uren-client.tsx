"use client";

import { useMemo, useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  deleteTimeEntry,
  logTimeEntry,
  updateTimeEntry,
  startTimer,
  stopTimer,
  discardTimer,
  getClientsForInvoice,
  getUnbilledEntriesForWeek,
  createInvoiceFromHours,
  type TimeEntryDto,
  type WeekSummary,
  type RunningTimerDto,
  type ClientBasic,
} from "@/actions/time-actions";
import { WORK_TYPES, calculateHoursFromTimes, isTimeAfter, isBreakValid } from "@/lib/time-constants";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Clock3,
  Coffee,
  Edit2,
  Euro,
  FileText,
  Loader2,
  Play,
  Plus,
  Square,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { cn, formatBedrag } from "@/lib/utils";
import { ExportButton } from "@/components/ui/export-button";

type UrenClientProps = {
  entries: TimeEntryDto[];
  totalHours: number;
  weekSummaries: WeekSummary[];
  runningTimer: RunningTimerDto;
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
  billable: boolean;
  hourlyRate: string;
  projectTag: string;
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
  billable: true,
  hourlyRate: "",
  projectTag: "",
});

export function UrenClient({ entries, totalHours, weekSummaries, runningTimer, canEdit, canExport }: UrenClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [editingEntry, setEditingEntry] = useState<TimeEntryDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"entries" | "weeks">("entries");
  
  // Timer state
  const [showTimerForm, setShowTimerForm] = useState(false);
  const [timerDescription, setTimerDescription] = useState("");
  const [timerWorkType, setTimerWorkType] = useState("Project");
  const [timerProjectTag, setTimerProjectTag] = useState("");
  const [timerBreakMinutes, setTimerBreakMinutes] = useState("0");
  const [elapsedTime, setElapsedTime] = useState(runningTimer?.elapsedMinutes ?? 0);

  // Invoice from hours state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceWeek, setInvoiceWeek] = useState<{ weekNumber: number; year: number } | null>(null);
  const [invoiceClients, setInvoiceClients] = useState<ClientBasic[]>([]);
  const [invoiceEntries, setInvoiceEntries] = useState<TimeEntryDto[]>([]);
  const [invoiceSelectedEntries, setInvoiceSelectedEntries] = useState<Set<string>>(new Set());
  const [invoiceClientId, setInvoiceClientId] = useState("");
  const [invoiceHourlyRate, setInvoiceHourlyRate] = useState("75.00");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoiceGrouping, setInvoiceGrouping] = useState<"single" | "per-day" | "per-project">("single");
  const [invoiceVatRate, setInvoiceVatRate] = useState<"21" | "9" | "0">("21");
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Update elapsed time every minute when timer is running
  useEffect(() => {
    if (!runningTimer) {
      setElapsedTime(0);
      return;
    }
    
    // Calculate current elapsed time
    const startTime = new Date(runningTimer.timerStartedAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const minutes = Math.floor((now - startTime) / 60000);
      setElapsedTime(minutes);
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [runningTimer]);

  const formatElapsedTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}u ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  const progress = useMemo(() => Math.min((totalHours / HOURS_GOAL) * 100, 100), [totalHours]);
  const goalReached = totalHours >= HOURS_GOAL;
  const badgeVariant = goalReached ? "success" : "info";
  const progressColor = goalReached ? "bg-emerald-500" : progress >= 75 ? "bg-amber-500" : "bg-sky-500";

  // Calculate billable summary from entries
  const billableSummary = useMemo(() => {
    let billableHours = 0;
    let estimatedAmount = 0;
    for (const entry of entries) {
      if (entry.billable) {
        billableHours += entry.hours;
        if (entry.hourlyRate) {
          estimatedAmount += entry.hours * entry.hourlyRate;
        }
      }
    }
    return { billableHours, estimatedAmount };
  }, [entries]);

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
      billable: entry.billable,
      hourlyRate: entry.hourlyRate ? String(entry.hourlyRate) : "",
      projectTag: entry.projectTag || "",
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
          billable: formState.billable,
          hourlyRate: formState.hourlyRate ? Number.parseFloat(formState.hourlyRate) : undefined,
          projectTag: formState.projectTag.trim() || undefined,
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

  // Timer handlers
  const handleStartTimer = () => {
    if (!canEdit) return;
    const trimmedDescription = timerDescription.trim();
    if (!trimmedDescription) {
      setFormError("Voer een omschrijving in om de timer te starten.");
      return;
    }
    
    startTransition(async () => {
      try {
        await startTimer({
          description: trimmedDescription,
          workType: timerWorkType || undefined,
          projectTag: timerProjectTag.trim() || undefined,
        });
        setShowTimerForm(false);
        setTimerDescription("");
        setTimerProjectTag("");
        setFormError(null);
        router.refresh();
      } catch (error) {
        console.error("Timer starten mislukt", error);
        setFormError(error instanceof Error ? error.message : "Timer starten mislukt.");
      }
    });
  };

  const handleStopTimer = () => {
    if (!canEdit) return;
    startTransition(async () => {
      try {
        await stopTimer(Number(timerBreakMinutes) || 0);
        setTimerBreakMinutes("0");
        setFormError(null);
        router.refresh();
      } catch (error) {
        console.error("Timer stoppen mislukt", error);
        setFormError(error instanceof Error ? error.message : "Timer stoppen mislukt.");
      }
    });
  };

  const handleDiscardTimer = () => {
    if (!canEdit) return;
    startTransition(async () => {
      try {
        await discardTimer();
        setFormError(null);
        router.refresh();
      } catch (error) {
        console.error("Timer annuleren mislukt", error);
        setFormError(error instanceof Error ? error.message : "Timer annuleren mislukt.");
      }
    });
  };

  // Invoice from hours handlers
  const openInvoiceModal = async (weekNumber: number, year: number) => {
    if (!canEdit) return;
    setInvoiceLoading(true);
    setInvoiceWeek({ weekNumber, year });
    setShowInvoiceModal(true);
    setFormError(null);

    try {
      const [clients, unbilledEntries] = await Promise.all([
        getClientsForInvoice(),
        getUnbilledEntriesForWeek(weekNumber, year),
      ]);
      
      setInvoiceClients(clients);
      setInvoiceEntries(unbilledEntries);
      setInvoiceSelectedEntries(new Set(unbilledEntries.map(e => e.id)));
      
      // Set default hourly rate from entries if available
      const entryWithRate = unbilledEntries.find(e => e.hourlyRate);
      if (entryWithRate?.hourlyRate) {
        setInvoiceHourlyRate(String(entryWithRate.hourlyRate));
      }
    } catch (error) {
      console.error("Laden mislukt", error);
      setFormError("Kon gegevens niet laden.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setInvoiceWeek(null);
    setInvoiceClients([]);
    setInvoiceEntries([]);
    setInvoiceSelectedEntries(new Set());
    setInvoiceClientId("");
    setInvoiceDescription("");
    setFormError(null);
  };

  const toggleInvoiceEntry = (entryId: string) => {
    setInvoiceSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const handleCreateInvoice = () => {
    if (!canEdit || !invoiceClientId || invoiceSelectedEntries.size === 0) return;
    
    startTransition(async () => {
      try {
        const result = await createInvoiceFromHours({
          clientId: invoiceClientId,
          hourlyRate: parseFloat(invoiceHourlyRate) || 0,
          description: invoiceDescription.trim() || "Gewerkte uren",
          grouping: invoiceGrouping,
          timeEntryIds: Array.from(invoiceSelectedEntries),
          vatRate: invoiceVatRate,
        });
        
        closeInvoiceModal();
        router.refresh();
        
        // Navigate to the new invoice
        if (result.invoiceId) {
          router.push(`/facturen/${result.invoiceId}`);
        }
      } catch (error) {
        console.error("Factuur maken mislukt", error);
        setFormError(error instanceof Error ? error.message : "Factuur maken mislukt.");
      }
    });
  };

  // Calculate invoice totals
  const invoiceTotals = useMemo(() => {
    const selectedEntries = invoiceEntries.filter(e => invoiceSelectedEntries.has(e.id));
    const totalHours = selectedEntries.reduce((sum, e) => sum + e.hours, 0);
    const rate = parseFloat(invoiceHourlyRate) || 0;
    const subtotal = totalHours * rate;
    const vatPercent = invoiceVatRate === "21" ? 0.21 : invoiceVatRate === "9" ? 0.09 : 0;
    const vatAmount = subtotal * vatPercent;
    const total = subtotal + vatAmount;
    return { totalHours, subtotal, vatAmount, total };
  }, [invoiceEntries, invoiceSelectedEntries, invoiceHourlyRate, invoiceVatRate]);

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
            {canEdit && !runningTimer && (
              <button
                type="button"
                onClick={() => setShowTimerForm(true)}
                className={buttonVariants("secondary", "inline-flex items-center gap-2")}
              >
                <Play className="h-4 w-4" aria-hidden />
                Start timer
              </button>
            )}
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
                Nieuwe registratie
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Running Timer Card */}
      {runningTimer && canEdit && (
        <Card className="border-2 border-primary/50 bg-primary/5 shadow-lg animate-pulse-slow">
          <CardContent className="py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2.5">
                  <Timer className="h-6 w-6 text-primary animate-pulse" aria-hidden />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{runningTimer.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {runningTimer.workType && <Badge variant="muted">{runningTimer.workType}</Badge>}
                    {runningTimer.projectTag && <span>{runningTimer.projectTag}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-primary">{formatElapsedTime(elapsedTime)}</p>
                  <p className="text-xs text-muted-foreground">Lopende timer</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground">Pauze:</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={timerBreakMinutes}
                      onChange={(e) => setTimerBreakMinutes(e.target.value)}
                      className="w-16 rounded border border-border bg-background px-2 py-1 text-sm"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStopTimer}
                    disabled={isPending}
                    className={buttonVariants("primary", "inline-flex items-center gap-1.5")}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                    Stop
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardTimer}
                    disabled={isPending}
                    className={buttonVariants("destructive", "inline-flex items-center gap-1.5")}
                    title="Timer annuleren"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Summary Header */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-500/10 p-2">
              <Clock className="h-5 w-5 text-sky-500" aria-hidden />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Totaal uren (dit jaar)</p>
              <p className="text-xl font-bold text-foreground">{totalHours.toFixed(2)} uur</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Factureerbare uren</p>
              <p className="text-xl font-bold text-foreground">{billableSummary.billableHours.toFixed(2)} uur</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Euro className="h-5 w-5 text-amber-500" aria-hidden />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Geschatte waarde</p>
              <p className="text-xl font-bold text-foreground">{formatBedrag(billableSummary.estimatedAmount)}</p>
            </div>
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
                        <th className="px-3 py-2">Type/Project</th>
                        <th className="px-3 py-2">Omschrijving</th>
                        <th className="px-3 py-2 text-right">Uren</th>
                        <th className="px-3 py-2 text-right">Bedrag</th>
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
                            <div className="flex flex-col gap-1">
                              {entry.workType && (
                                <Badge variant="muted">{entry.workType}</Badge>
                              )}
                              {entry.projectTag && (
                                <span className="text-xs text-muted-foreground">{entry.projectTag}</span>
                              )}
                            </div>
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
                            <div className="flex flex-col items-end gap-0.5">
                              <span>{entry.hours.toFixed(2)} uur</span>
                              {entry.billable ? (
                                <Badge variant="success" className="text-xs px-1.5 py-0">Factureerbaar</Badge>
                              ) : (
                                <Badge variant="muted" className="text-xs px-1.5 py-0">Niet factureerbaar</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                            {entry.billable && entry.hourlyRate ? (
                              formatBedrag(entry.hours * entry.hourlyRate)
                            ) : (
                              <span className="text-xs">-</span>
                            )}
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
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-lg font-bold text-foreground">{entry.hours.toFixed(2)}u</span>
                          {entry.billable && entry.hourlyRate && (
                            <span className="text-xs text-muted-foreground">{formatBedrag(entry.hours * entry.hourlyRate)}</span>
                          )}
                        </div>
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
                        {entry.projectTag && (
                          <span className="bg-card px-2 py-1 rounded">{entry.projectTag}</span>
                        )}
                        {entry.billable ? (
                          <Badge variant="success" className="text-xs">Factureerbaar</Badge>
                        ) : (
                          <Badge variant="muted" className="text-xs">Niet fact.</Badge>
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Week {week.weekNumber}, {week.year}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {week.billableHours > 0 && (
                            <>Factureerbaar: {week.billableHours.toFixed(2)} uur</>
                          )}
                          {week.estimatedAmount > 0 && (
                            <> · {formatBedrag(week.estimatedAmount)}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-foreground">
                          {week.totalHours.toFixed(2)} uur
                        </span>
                        {canEdit && week.billableHours > 0 && (
                          <button
                            type="button"
                            onClick={() => openInvoiceModal(week.weekNumber, week.year)}
                            className={buttonVariants("secondary", "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5")}
                            title="Maak factuur van deze week"
                          >
                            <FileText className="h-3.5 w-3.5" aria-hidden />
                            Factureer
                          </button>
                        )}
                      </div>
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

                {/* Project Tag */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Project tag (optioneel)</label>
                  <input
                    type="text"
                    value={formState.projectTag}
                    onChange={(e) => setFormState((prev) => ({ ...prev, projectTag: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Bijv. PRJ-001, Website, Maandafsluiting"
                  />
                </div>

                {/* Billable section */}
                <div className="space-y-3 rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Factureerbaar</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.billable}
                        onChange={(e) => setFormState((prev) => ({ ...prev, billable: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {formState.billable && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Uurtarief (optioneel)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formState.hourlyRate}
                          onChange={(e) => setFormState((prev) => ({ ...prev, hourlyRate: e.target.value }))}
                          className="w-full rounded-lg border border-input bg-background pl-7 pr-3 py-2 text-sm text-foreground"
                          placeholder="75.00"
                        />
                      </div>
                    </div>
                  )}
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

      {/* Start Timer Modal */}
      {showTimerForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-sm">
          <div className="flex min-h-full items-end justify-center p-3 sm:items-center">
            <div className="w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Timer starten</h2>
                  <p className="text-sm text-muted-foreground">Wat ga je doen?</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowTimerForm(false);
                    setTimerDescription("");
                    setTimerProjectTag("");
                    setFormError(null);
                  }}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted transition"
                  aria-label="Sluiten"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="px-4 pb-4 space-y-4">
                {/* Description */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Omschrijving *</label>
                  <input
                    type="text"
                    value={timerDescription}
                    onChange={(e) => setTimerDescription(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Waar ga je aan werken?"
                    autoFocus
                  />
                </div>

                {/* Work Type */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Werktype</label>
                  <select
                    value={timerWorkType}
                    onChange={(e) => setTimerWorkType(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {WORK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Tag */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Project tag (optioneel)</label>
                  <input
                    type="text"
                    value={timerProjectTag}
                    onChange={(e) => setTimerProjectTag(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Bijv. PRJ-001, Website"
                  />
                </div>

                {formError && <p className="text-sm text-destructive">{formError}</p>}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTimerForm(false);
                      setTimerDescription("");
                      setTimerProjectTag("");
                      setFormError(null);
                    }}
                    className={buttonVariants("outline", "flex-1")}
                  >
                    Annuleren
                  </button>
                  <button
                    type="button"
                    onClick={handleStartTimer}
                    disabled={isPending || !timerDescription.trim()}
                    className={buttonVariants("primary", "flex-1 inline-flex items-center justify-center gap-2")}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Starten...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" aria-hidden />
                        Start timer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice from Hours Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-sm">
          <div className="flex min-h-full items-end justify-center p-3 sm:items-center">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl">
              <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Factuur maken van week {invoiceWeek?.weekNumber}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Selecteer uren en stel factuuropties in
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeInvoiceModal}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted transition"
                  aria-label="Sluiten"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {invoiceLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : invoiceEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Geen factureerbare uren gevonden voor deze week, of alle uren zijn al gefactureerd.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Client Selection */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Klant (Relatie) *</label>
                      <select
                        value={invoiceClientId}
                        onChange={(e) => setInvoiceClientId(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                        required
                      >
                        <option value="">Selecteer een klant...</option>
                        {invoiceClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Hourly Rate & VAT */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">Uurtarief *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={invoiceHourlyRate}
                            onChange={(e) => setInvoiceHourlyRate(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background pl-7 pr-3 py-2 text-sm text-foreground"
                            placeholder="75.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-foreground">BTW-tarief</label>
                        <select
                          value={invoiceVatRate}
                          onChange={(e) => setInvoiceVatRate(e.target.value as "21" | "9" | "0")}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                        >
                          <option value="21">21%</option>
                          <option value="9">9%</option>
                          <option value="0">0%</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Omschrijving</label>
                      <input
                        type="text"
                        value={invoiceDescription}
                        onChange={(e) => setInvoiceDescription(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                        placeholder="Gewerkte uren"
                      />
                    </div>

                    {/* Grouping Options */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Groepering op factuur</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setInvoiceGrouping("single")}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm border transition-colors",
                            invoiceGrouping === "single"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card hover:bg-muted"
                          )}
                        >
                          Eén regel
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvoiceGrouping("per-day")}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm border transition-colors",
                            invoiceGrouping === "per-day"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card hover:bg-muted"
                          )}
                        >
                          Per dag
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvoiceGrouping("per-project")}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm border transition-colors",
                            invoiceGrouping === "per-project"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card hover:bg-muted"
                          )}
                        >
                          Per project
                        </button>
                      </div>
                    </div>

                    {/* Time Entries Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Uren selecteren</label>
                        <span className="text-xs text-muted-foreground">
                          {invoiceSelectedEntries.size} van {invoiceEntries.length} geselecteerd
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                        {invoiceEntries.map((entry) => (
                          <label
                            key={entry.id}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted transition-colors",
                              invoiceSelectedEntries.has(entry.id) && "bg-primary/5"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={invoiceSelectedEntries.has(entry.id)}
                              onChange={() => toggleInvoiceEntry(entry.id)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{entry.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(entry.date)} · {entry.hours.toFixed(2)} uur
                                {entry.projectTag && ` · ${entry.projectTag}`}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {entry.hours.toFixed(2)}u
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Totaal uren:</span>
                        <span className="font-semibold">{invoiceTotals.totalHours.toFixed(2)} uur</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotaal:</span>
                        <span className="font-semibold">{formatBedrag(invoiceTotals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">BTW ({invoiceVatRate}%):</span>
                        <span className="font-semibold">{formatBedrag(invoiceTotals.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between text-base pt-2 border-t border-border">
                        <span className="font-semibold">Totaal incl. BTW:</span>
                        <span className="font-bold text-primary">{formatBedrag(invoiceTotals.total)}</span>
                      </div>
                    </div>
                  </>
                )}

                {formError && <p className="text-sm text-destructive">{formError}</p>}
              </div>

              <div className="flex items-center gap-3 px-4 py-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeInvoiceModal}
                  className={buttonVariants("outline", "flex-1")}
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleCreateInvoice}
                  disabled={isPending || invoiceLoading || !invoiceClientId || invoiceSelectedEntries.size === 0}
                  className={buttonVariants("primary", "flex-1 inline-flex items-center justify-center gap-2")}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Maken...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" aria-hidden />
                      Maak factuur
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
