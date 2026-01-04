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
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Nieuwe afspraak</p>
            <h2 className="text-lg font-bold text-slate-900">Voeg een afspraak toe aan je agenda</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Sluiten"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="event-title">
              Titel
            </label>
              <input
                id="event-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner shadow-white/60 focus:border-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#d7e1ea]"
                placeholder="Bijv. Intakegesprek met klant"
              />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="event-description">
              Beschrijving
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
              <textarea
                id="event-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-[72px] w-full rounded-lg border border-slate-200 bg-white/90 pl-10 pr-3 py-2 text-sm text-slate-900 shadow-inner shadow-white/60 focus:border-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#d7e1ea]"
                placeholder="Notities of locatie"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800" htmlFor="event-start">
                Start
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  id="event-start"
                  type="datetime-local"
                  required
                  value={form.start}
                  onChange={(e) => setForm((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white/90 pl-10 pr-3 py-2 text-sm text-slate-900 shadow-inner shadow-white/60 focus:border-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#d7e1ea]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800" htmlFor="event-end">
                Eind
              </label>
              <div className="relative">
                <Clock3 className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  id="event-end"
                  type="datetime-local"
                  required
                  value={form.end}
                  onChange={(e) => setForm((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white/90 pl-10 pr-3 py-2 text-sm text-slate-900 shadow-inner shadow-white/60 focus:border-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#d7e1ea]"
                />
              </div>
            </div>
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
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
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Agenda</h1>
            <p className="text-sm text-slate-600">
              Plan afspraken, zie je kalender en start snel een nieuwe afspraak.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={cn(buttonVariants("primary", "inline-flex items-center gap-2"), "hidden md:inline-flex")}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nieuwe afspraak
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="bg-white shadow-sm">
            <CardHeader className="items-start gap-3 md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-50 p-2 text-teal-700 ring-1 ring-teal-200">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle className="text-base">Kalender</CardTitle>
                  <p className="text-xs text-slate-600">{maandNaam}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="hidden md:grid grid-cols-7 gap-2 text-xs font-semibold uppercase text-slate-500">
                {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((dag) => (
                  <span key={dag} className="text-center tracking-wide">
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
                        "min-h-[110px] rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm transition hover:border-teal-200 hover:shadow-md",
                        dagEvents.length > 0 && "ring-1 ring-teal-200",
                      )}
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full",
                            isVandaag(dag) ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700",
                          )}
                          aria-label={isVandaag(dag) ? "Vandaag" : undefined}
                        >
                          {dag}
                        </span>
                        {dagEvents.length > 0 && (
                          <Badge variant="primary">{formatAfspraakLabel(dagEvents.length)}</Badge>
                        )}
                      </div>

                      <div className="mt-2 space-y-2">
                        {dagEvents.map((event) => (
                          <div
                            key={event.id}
                            className="rounded-lg border border-teal-200 bg-teal-50 p-2 text-xs text-teal-700"
                          >
                            <p className="font-semibold leading-tight">{event.title}</p>
                            <p className="flex items-center gap-1 text-[11px] text-slate-600">
                              <Clock3 className="h-3 w-3" aria-hidden="true" />
                              {formatTijd(event.start)} - {formatTijd(event.end)}
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
                  <p className="text-sm font-semibold text-slate-800">Verticale tijdlijn</p>
                  <Badge variant="primary">Mobiel</Badge>
                </div>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-slate-600">Nog geen afspraken gepland.</p>
                ) : (
                  <div className="relative space-y-4 pl-5 before:absolute before:left-[6px] before:top-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-teal-600/70 before:via-teal-200/40 before:to-transparent">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/30 p-4 backdrop-blur-xl shadow-lg shadow-[0_16px_44px_-28px_rgba(13,148,136,0.30)] ring-1 ring-white/60"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute -left-[14px] top-4 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/70 bg-teal-600 shadow-sm shadow-[0_10px_26px_-18px_rgba(13,148,136,0.40)]"
                        />
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            {new Intl.DateTimeFormat("nl-NL", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            }).format(event.start)}
                          </p>
                          <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                          {event.description ? (
                            <p className="text-xs text-slate-700">{event.description}</p>
                          ) : null}
                        </div>
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/40 bg-white/20 px-3 py-2 text-xs font-semibold text-slate-800 backdrop-blur">
                          <Clock3 className="h-4 w-4 text-[#4A5568]" aria-hidden="true" />
                          {formatTijd(event.start)} - {formatTijd(event.end)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Aankomende afspraken</CardTitle>
              <Badge variant="muted">Overzicht</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {gesorteerdeDagen.length === 0 ? (
                <p className="text-sm text-slate-600">Nog geen afspraken gepland.</p>
              ) : (
                gesorteerdeDagen.map((dag) => (
                  <div key={dag} className="space-y-2 rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                      <span>
                        {new Intl.DateTimeFormat("nl-NL", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        }).format(new Date(dag))}
                      </span>
                      <Badge variant="primary">{formatAfspraakLabel(eventsByDag[dag].length)}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-slate-700">
                      {eventsByDag[dag].map((event) => (
                        <div key={event.id} className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{event.title}</p>
                            {event.description ? (
                              <p className="text-xs text-slate-600">{event.description}</p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                          <Clock3 className="h-3 w-3 text-[#4A5568]" aria-hidden="true" />
                            {formatTijd(event.start)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-[0_18px_42px_-22px_rgba(13,148,136,0.30)] transition hover:scale-105 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 md:hidden"
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
