"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlignLeft, Calendar, CalendarDays, Clock3, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createEvent } from "./actions";

const MS_PER_MINUTE = 60000;
const HOUR_IN_MS = 3_600_000; // one hour in milliseconds

type AgendaEventDto = {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
};

type ParsedAgendaEvent = Omit<AgendaEventDto, 'start' | 'end'> & { start: Date; end: Date };

type AgendaViewProps = {
  events: AgendaEventDto[];
};

function formatLocalInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * MS_PER_MINUTE).toISOString().slice(0, 16);
}

type AddEventModalProps = {
  open: boolean;
  onClose: () => void;
  onAdded: (event: AgendaEventDto) => void;
};

function AddEventModal({ open, onClose, onAdded }: AddEventModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    start: string;
    end: string;
  }>({
    title: "",
    description: "",
    start: formatLocalInput(now),
    end: formatLocalInput(new Date(now.getTime() + HOUR_IN_MS)),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const descriptionValue = form.description.trim();
      const result = await createEvent({
        title: form.title.trim(),
        description: descriptionValue || undefined,
        start: form.start,
        end: form.end,
      });

      if (result?.success && result.event) {
        const created = result.event;
        onAdded({
          id: created.id,
          title: created.title,
          description: created.description ?? "",
          start: created.start.toISOString(),
          end: created.end.toISOString(),
        });
        onClose();
        router.refresh();
        setForm({
          title: "",
          description: "",
          start: formatLocalInput(new Date()),
          end: formatLocalInput(new Date(Date.now() + HOUR_IN_MS)),
        });
      } else {
        setError(result?.message ?? "Opslaan van de afspraak is mislukt.");
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/40 dark:bg-black/60 px-4 py-6">
      <div className="w-full max-w-lg rounded-lg bg-card shadow-lg border border-border">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Nieuwe afspraak</p>
            <h2 className="text-lg font-bold text-foreground">Voeg een afspraak toe aan je agenda</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-primary transition hover:bg-primary/10"
            aria-label="Sluiten"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="event-title">
              Titel
            </label>
              <input
                id="event-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Bijv. Intakegesprek met klant"
              />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="event-description">
              Beschrijving
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <textarea
                id="event-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-[72px] w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Notities of locatie"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="event-start">
                Start
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input
                  id="event-start"
                  type="datetime-local"
                  required
                  value={form.start}
                  onChange={(e) => setForm((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="event-end">
                Eind
              </label>
              <div className="relative">
                <Clock3 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input
                  id="event-end"
                  type="datetime-local"
                  required
                  value={form.end}
                  onChange={(e) => setForm((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={buttonVariants("outline", "px-4 py-2 text-sm font-semibold")}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={buttonVariants("primary", "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold")}
            >
              {isPending ? "Inplannen..." : "Inplannen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AgendaView({ events }: AgendaViewProps) {
  const searchParams = useSearchParams();
  const shouldOpen = searchParams.get("add") === "1" || searchParams.get("action") === "new";
  const [showAddModal, setShowAddModal] = useState(shouldOpen);
  const [localEvents, setLocalEvents] = useState(events);
  const vandaag = useMemo(() => new Date(), []);
  const maandStart = new Date(vandaag.getFullYear(), vandaag.getMonth(), 1);
  const dagenInMaand = new Date(vandaag.getFullYear(), vandaag.getMonth() + 1, 0).getDate();
  const startOffset = (maandStart.getDay() + 6) % 7;
  const maandNaam = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(vandaag);

  const parsedEvents: ParsedAgendaEvent[] = localEvents
    .map((event) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const eventsThisMonth = parsedEvents.filter(
    (event) =>
      event.start.getMonth() === vandaag.getMonth() && event.start.getFullYear() === vandaag.getFullYear(),
  );

  const eventsByDag = eventsThisMonth.reduce<Record<string, ParsedAgendaEvent[]>>((acc, event) => {
    const key = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate())
      .toISOString()
      .split("T")[0];
    acc[key] = acc[key] ? [...acc[key], event] : [event];
    return acc;
  }, {});

  const gesorteerdeDagen = Object.keys(eventsByDag).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const formatTijd = (datum: Date) =>
    datum.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  const formatAfspraakLabel = (aantal: number) =>
    `${aantal} ${aantal === 1 ? "afspraak" : "afspraken"}`;

  const isVandaag = (dag: number) => {
    return (
      dag === vandaag.getDate() &&
      maandStart.getMonth() === vandaag.getMonth() &&
      maandStart.getFullYear() === vandaag.getFullYear()
    );
  };

  const upcomingEvents = parsedEvents;

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Plan afspraken en beheer je kalender
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={cn(buttonVariants("primary"), "hidden md:inline-flex")}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nieuwe afspraak
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium text-card-foreground">Kalender</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{maandNaam}</p>
                </div>
                <CalendarDays className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="hidden md:grid grid-cols-7 gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((dag) => (
                  <span key={dag} className="text-center">
                    {dag}
                  </span>
                ))}
              </div>

              <div className="hidden md:grid grid-cols-7 gap-2">
                {Array.from({ length: startOffset }).map((_, index) => (
                  <div key={`empty-${index}`} aria-hidden />
                ))}

                {Array.from({ length: dagenInMaand }).map((_, index) => {
                  const dag = index + 1;
                  const datum = new Date(vandaag.getFullYear(), vandaag.getMonth(), dag);
                  const key = datum.toISOString().split("T")[0];
                  const dagEvents = eventsByDag[key] ?? [];

                  return (
                    <div
                      key={dag}
                      className={cn(
                        "min-h-[110px] rounded-lg border p-3",
                        dagEvents.length > 0 
                          ? "border-primary/30 bg-primary/5" 
                          : "border-border bg-card",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                            isVandaag(dag) 
                              ? "bg-primary text-primary-foreground" 
                              : "text-foreground",
                          )}
                          aria-label={isVandaag(dag) ? "Vandaag" : undefined}
                        >
                          {dag}
                        </span>
                        {dagEvents.length > 0 && (
                          <span className="text-xs font-medium text-muted-foreground">{dagEvents.length}</span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1.5">
                        {dagEvents.map((event) => (
                          <div
                            key={event.id}
                            className="rounded px-2 py-1.5 bg-card border border-primary/20"
                          >
                            <p className="text-xs font-medium text-foreground leading-tight truncate">{event.title}</p>
                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                              <Clock3 className="h-3 w-3" aria-hidden="true" />
                              {formatTijd(event.start)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

                  <div className="md:hidden" aria-label="Afspraken lijstweergave">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Verticale tijdlijn</p>
                  <Badge variant="primary">Mobiel</Badge>
                </div>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nog geen afspraken gepland.</p>
                ) : (
                  <div className="relative space-y-4 pl-5 before:absolute before:left-[6px] before:top-0 before:h-full before:w-[2px] before:bg-primary/30">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute -left-[14px] top-4 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-card bg-primary shadow-sm"
                        />
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {new Intl.DateTimeFormat("nl-NL", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            }).format(event.start)}
                          </p>
                          <p className="text-sm font-semibold text-foreground">{event.title}</p>
                          {event.description ? (
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                          ) : null}
                        </div>
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground">
                          <Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          {formatTijd(event.start)} - {formatTijd(event.end)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-card-foreground">Aankomende afspraken</CardTitle>
                <Badge variant="muted">{gesorteerdeDagen.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {gesorteerdeDagen.length === 0 ? (
                <p className="text-sm text-muted-foreground">Geen afspraken gepland</p>
              ) : (
                <div className="divide-y divide-border">
                  {gesorteerdeDagen.map((dag) => (
                    <div key={dag} className="py-4 first:pt-0">
                      <p className="text-sm font-medium text-foreground mb-3">
                        {new Intl.DateTimeFormat("nl-NL", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        }).format(new Date(dag))}
                      </p>
                      <div className="space-y-2">
                        {eventsByDag[dag].map((event) => (
                          <div key={event.id} className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                              {event.description && (
                                <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                              )}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground tabular-nums">
                              {formatTijd(event.start)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground border border-primary/80 shadow-lg transition hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 md:hidden"
        aria-label="Nieuwe afspraak toevoegen"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>

      <AddEventModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={(event) => setLocalEvents((prev) => [...prev, event])}
      />
    </>
  );
}
