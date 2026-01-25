import { getEvents } from "./actions";
import { AgendaView } from "./agenda-view";
import { requireOwnerPage } from "@/lib/auth/route-guards";

export default async function AgendaPagina() {
  // Owner-only page guard
  await requireOwnerPage();
  
  const events = await getEvents();
  const serializedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description ?? "",
    start: event.start.toISOString(),
    end: event.end.toISOString(),
  }));

  return <AgendaView events={serializedEvents} />;
}
