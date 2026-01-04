import Link from "next/link";
import { CalendarDays, Clock3, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AgendaEvent = {
  id: string;
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
};

export default function AgendaPagina() {
  const vandaag = new Date();
  const maandStart = new Date(vandaag.getFullYear(), vandaag.getMonth(), 1);
  const dagenInMaand = new Date(vandaag.getFullYear(), vandaag.getMonth() + 1, 0).getDate();
  const startOffset = (maandStart.getDay() + 6) % 7; // Maandag als eerste dag
  const maandNaam = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(vandaag);

  const weekDagen = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  const events: AgendaEvent[] = [
    {
      id: "1",
      title: "Project kick-off Nova BV",
      description: "Teams-call met projectteam",
      startDateTime: new Date(vandaag.getFullYear(), vandaag.getMonth(), 10, 9, 30),
      endDateTime: new Date(vandaag.getFullYear(), vandaag.getMonth(), 10, 11, 0),
    },
    {
      id: "2",
      title: "Opvolging offertes",
      description: "Check status en stuur reminders",
      startDateTime: new Date(vandaag.getFullYear(), vandaag.getMonth(), 12, 14, 0),
      endDateTime: new Date(vandaag.getFullYear(), vandaag.getMonth(), 12, 15, 0),
    },
    {
      id: "3",
      title: "On-site afspraak bij Skyline",
      description: "Bespreek planning en budget",
      startDateTime: new Date(vandaag.getFullYear(), vandaag.getMonth(), 18, 10, 0),
      endDateTime: new Date(vandaag.getFullYear(), vandaag.getMonth(), 18, 12, 0),
    },
    {
      id: "4",
      title: "BTW kwartaalvoorbereiding",
      description: "Controleer uren, facturen en uitgaven",
      startDateTime: new Date(vandaag.getFullYear(), vandaag.getMonth(), 24, 13, 0),
      endDateTime: new Date(vandaag.getFullYear(), vandaag.getMonth(), 24, 14, 30),
    },
  ];

  const eventsByDag = events.reduce<Record<string, AgendaEvent[]>>((acc, event) => {
    const key = new Date(
      event.startDateTime.getFullYear(),
      event.startDateTime.getMonth(),
      event.startDateTime.getDate(),
    ).toDateString();
    acc[key] = acc[key] ? [...acc[key], event] : [event];
    return acc;
  }, {});

  const gesorteerdeDagen = Object.keys(eventsByDag).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );
  const gesorteerdeEvents = [...events].sort(
    (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime(),
  );

  const formatTijd = (datum: Date) =>
    datum.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  const isVandaag = (dag: number) => {
    return (
      dag === vandaag.getDate() &&
      maandStart.getMonth() === vandaag.getMonth() &&
      maandStart.getFullYear() === vandaag.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-600">
            Plan afspraken, zie je kalender en start snel een nieuwe afspraak.
          </p>
        </div>
        <Link
          href="/agenda/nieuw"
          className={buttonVariants("primary", "inline-flex items-center gap-2")}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nieuwe afspraak
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="bg-white shadow-sm">
          <CardHeader className="items-start gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 p-2 text-indigo-700 ring-1 ring-indigo-100">
                <CalendarDays className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <CardTitle className="text-base">Kalender</CardTitle>
                <p className="text-xs text-slate-600">{maandNaam}</p>
              </div>
            </div>
            <Badge variant="primary">List view op mobiel</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden md:grid grid-cols-7 gap-2 text-xs font-semibold uppercase text-slate-500">
              {weekDagen.map((dag) => (
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
                const key = datum.toDateString();
                const dagEvents = eventsByDag[key] ?? [];

                return (
                  <div
                    key={dag}
                    className={cn(
                      "min-h-[110px] rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md",
                      dagEvents.length > 0 && "ring-1 ring-indigo-100",
                    )}
                  >
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full",
                          isVandaag(dag) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700",
                        )}
                        aria-label={isVandaag(dag) ? "Vandaag" : undefined}
                      >
                        {dag}
                      </span>
                      {dagEvents.length > 0 && (
                        <Badge variant="primary">{dagEvents.length} afspraak</Badge>
                      )}
                    </div>

                    <div className="mt-2 space-y-2">
                      {dagEvents.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-2 text-xs text-indigo-900"
                        >
                          <p className="font-semibold leading-tight">{event.title}</p>
                          <p className="flex items-center gap-1 text-[11px] text-indigo-800">
                            <Clock3 className="h-3 w-3" aria-hidden />
                            {formatTijd(event.startDateTime)} - {formatTijd(event.endDateTime)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="md:hidden space-y-3" aria-label="Afspraken lijstweergave">
              {gesorteerdeEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        {new Intl.DateTimeFormat("nl-NL", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        }).format(event.startDateTime)}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-600">{event.description}</p>
                    </div>
                    <Badge variant="primary">Dagweergave</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <Clock3 className="h-4 w-4 text-indigo-600" aria-hidden />
                    {formatTijd(event.startDateTime)} - {formatTijd(event.endDateTime)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Aankomende afspraken</CardTitle>
            <Badge variant="muted">Overzicht</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {gesorteerdeDagen.map((dag) => (
              <div key={dag} className="space-y-2 rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>
                    {new Intl.DateTimeFormat("nl-NL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).format(new Date(dag))}
                  </span>
                  <Badge variant="primary">{eventsByDag[dag].length} afspraak</Badge>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  {eventsByDag[dag].map((event) => (
                    <div key={event.id} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{event.title}</p>
                        <p className="text-xs text-slate-600">{event.description}</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                        <Clock3 className="h-3 w-3 text-indigo-600" aria-hidden />
                        {formatTijd(event.startDateTime)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
