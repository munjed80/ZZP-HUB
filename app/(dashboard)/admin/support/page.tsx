import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Filter, Mail } from "lucide-react";
import { SupportMessageStatus, UserRole } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { listSupportMessages } from "./actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusFilters = [
  { label: "Alle", value: "all" as const },
  { label: "Nieuw", value: SupportMessageStatus.NEW },
  { label: "Gelezen", value: SupportMessageStatus.READ },
  { label: "Gesloten", value: SupportMessageStatus.CLOSED },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function statusLabel(status: SupportMessageStatus) {
  switch (status) {
    case SupportMessageStatus.NEW:
      return "Nieuw";
    case SupportMessageStatus.READ:
      return "Gelezen";
    case SupportMessageStatus.CLOSED:
      return "Gesloten";
    default:
      return status;
  }
}

function statusVariant(status: SupportMessageStatus) {
  switch (status) {
    case SupportMessageStatus.NEW:
      return "primary" as const;
    case SupportMessageStatus.READ:
      return "info" as const;
    case SupportMessageStatus.CLOSED:
      return "muted" as const;
  }
}

export default async function SupportInboxPage({ searchParams }: { searchParams?: Promise<{ status?: string; q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== UserRole.SUPERADMIN) {
    redirect("/");
  }

  const searchQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";
  const rawStatus = typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status.toUpperCase() : "ALL";
  const isValidStatus = Object.values(SupportMessageStatus).includes(rawStatus as SupportMessageStatus);
  const statusFilter = isValidStatus ? (rawStatus as SupportMessageStatus) : undefined;
  const activeStatus = statusFilter ?? "all";

  const messages = await listSupportMessages({
    status: statusFilter,
    query: searchQuery || undefined,
  });

  const buildStatusHref = (value: (typeof statusFilters)[number]["value"]) => {
    const params = new URLSearchParams();
    if (value !== "all") {
      params.set("status", value);
    }
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    const query = params.toString();
    return query ? `/admin/support?${query}` : "/admin/support";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary via-accent to-success"></div>
          <h1 className="text-3xl font-bold text-foreground">Support Inbox</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Inkomende supportberichten voor SuperAdmins. Filter op status en doorzoek onderwerp of e-mail.
        </p>
      </div>

      <div className="rounded-2xl border border-border shadow-sm bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => {
              const isActive = activeStatus === filter.value;
              return (
                <Link
                  key={filter.value}
                  href={buildStatusHref(filter.value)}
                  className={cn(
                    buttonVariants(isActive ? "primary" : "secondary"),
                    "h-10 rounded-full px-3 text-sm font-semibold",
                  )}
                >
                  <Filter className="mr-2 h-4 w-4" aria-hidden />
                  {filter.label}
                </Link>
              );
            })}
          </div>
          <form className="flex flex-col gap-2 sm:flex-row sm:items-center" method="GET">
            {activeStatus !== "all" ? <input type="hidden" name="status" value={activeStatus} /> : null}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Zoek op onderwerp of e-mail"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-9 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button type="submit" className={cn(buttonVariants("primary"), "sm:w-auto")}>
              Zoeken
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Onderwerp</th>
                <th className="px-4 py-3">Afzender</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Geen berichten gevonden voor deze filters.
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr key={message.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(message.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <Link href={`/admin/support/${message.id}`} className="hover:underline">
                        {message.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-foreground">
                        <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
                        <div className="flex flex-col">
                          <span className="font-medium">{message.name}</span>
                          <span className="text-xs text-muted-foreground">{message.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(message.status)}>{statusLabel(message.status)}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
