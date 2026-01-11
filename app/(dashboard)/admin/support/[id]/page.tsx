import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, Mail, UserRound, CheckCircle, Archive } from "lucide-react";
import { SupportMessageStatus, UserRole } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupportMessage, setSupportMessageStatus } from "../actions";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusCopy(status: SupportMessageStatus) {
  switch (status) {
    case SupportMessageStatus.NEW:
      return { label: "Nieuw", variant: "primary" as const };
    case SupportMessageStatus.READ:
      return { label: "Gelezen", variant: "info" as const };
    case SupportMessageStatus.CLOSED:
      return { label: "Gesloten", variant: "muted" as const };
  }
}

export default async function SupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== UserRole.SUPERADMIN) {
    redirect("/");
  }

  const message = await getSupportMessage(id);
  if (!message) {
    notFound();
  }

  const statusMeta = statusCopy(message.status);

  const markAsRead = async () => {
    "use server";
    await setSupportMessageStatus(id, SupportMessageStatus.READ);
  };

  const closeMessage = async () => {
    "use server";
    await setSupportMessageStatus(id, SupportMessageStatus.CLOSED);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/support" className={cn(buttonVariants("ghost"), "gap-2")}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Terug naar inbox
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{message.subject}</h1>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4" aria-hidden />
              {formatDateTime(message.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" aria-hidden />
              {message.email}
            </span>
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4" aria-hidden />
              {message.name}
            </span>
            {message.userId ? <span className="text-xs text-muted-foreground">UserID: {message.userId}</span> : null}
          </div>

          <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
            <p className="text-sm font-semibold text-foreground mb-2">Bericht</p>
            <pre className="whitespace-pre-wrap text-sm text-foreground">{message.message}</pre>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-2">Acties</h2>
            <form action={markAsRead}>
              <button type="submit" className={cn(buttonVariants("secondary"), "w-full justify-center gap-2")}>
                <CheckCircle className="h-4 w-4" aria-hidden />
                Markeer als gelezen
              </button>
            </form>
            <form action={closeMessage} className="mt-2">
              <button type="submit" className={cn(buttonVariants("destructive"), "w-full justify-center gap-2")}>
                <Archive className="h-4 w-4" aria-hidden />
                Sluit bericht
              </button>
            </form>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Status</p>
            <p>{statusMeta.label} • bijgewerkt op {formatDateTime(message.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
