"use client";

import Link from "next/link";
import { AlertTriangle, Bell, Calendar, Clock, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatBedrag } from "@/lib/utils";
import { getNotificationColorClasses, type InvoiceNotification, type AgendaNotification } from "@/lib/notifications";

type NotificationsPanelProps = {
  invoiceNotifications: InvoiceNotification[];
  agendaNotifications: AgendaNotification[];
};

function formatDueDate(date: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatEventTime(date: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function NotificationsPanel({ invoiceNotifications, agendaNotifications }: NotificationsPanelProps) {
  const hasNotifications = invoiceNotifications.length > 0 || agendaNotifications.length > 0;

  if (!hasNotifications) {
    return null;
  }

  // Sort invoice notifications by severity: danger > warning > info
  const sortedInvoiceNotifications = [...invoiceNotifications].sort((a, b) => {
    const severityOrder = { danger: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Sort agenda notifications: today first, then tomorrow
  const sortedAgendaNotifications = [...agendaNotifications].sort((a, b) => {
    if (a.notificationType === "event_today" && b.notificationType !== "event_today") return -1;
    if (b.notificationType === "event_today" && a.notificationType !== "event_today") return 1;
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });

  return (
    <Card className="group transition-all duration-300 hover:shadow-[0_16px_48px_-16px_rgba(15,23,42,0.15)] border-l-4 border-l-amber-500">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-3.5 shadow-md ring-1 ring-amber-200/40 dark:ring-amber-700/40 group-hover:scale-105 transition-transform duration-300">
            <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Notificaties
              <Badge variant="warning" className="text-xs">
                {invoiceNotifications.length + agendaNotifications.length}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">Actie vereist</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invoice Notifications */}
        {sortedInvoiceNotifications.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Receipt className="h-3.5 w-3.5" />
              Factuur herinneringen
            </div>
            <div className="space-y-2">
              {sortedInvoiceNotifications.map((notification) => {
                const colors = getNotificationColorClasses(notification.severity);
                return (
                  <Link
                    key={notification.invoiceId}
                    href={`/facturen/${notification.invoiceId}`}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md",
                      colors.bg,
                      colors.border
                    )}
                  >
                    <div className={cn("mt-0.5 shrink-0", colors.icon)}>
                      {notification.severity === "danger" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-semibold", colors.text)}>
                        {notification.message}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{formatBedrag(notification.amount)}</span>
                        <span>•</span>
                        <span>Vervalt {formatDueDate(new Date(notification.dueDate))}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={notification.severity === "danger" ? "destructive" : notification.severity === "warning" ? "warning" : "info"}
                      className="shrink-0 text-[10px]"
                    >
                      {notification.notificationType === "overdue" ? "Verlopen" :
                       notification.notificationType === "due_today" ? "Vandaag" :
                       notification.notificationType === "due_tomorrow" ? "Morgen" : "2 dagen"}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Agenda Notifications */}
        {sortedAgendaNotifications.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              Komende afspraken
            </div>
            <div className="space-y-2">
              {sortedAgendaNotifications.map((notification) => {
                const colors = getNotificationColorClasses(notification.severity);
                return (
                  <Link
                    key={notification.eventId}
                    href="/agenda"
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md",
                      colors.bg,
                      colors.border
                    )}
                  >
                    <div className={cn("mt-0.5 shrink-0", colors.icon)}>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-semibold", colors.text)}>
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatEventTime(new Date(notification.start))}
                      </p>
                    </div>
                    <Badge 
                      variant={notification.notificationType === "event_today" ? "primary" : "info"}
                      className="shrink-0 text-[10px]"
                    >
                      {notification.notificationType === "event_today" ? "Vandaag" : "Morgen"}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
