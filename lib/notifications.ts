/**
 * Notification system utilities for invoice due dates and agenda reminders
 * Supports multi-tenant isolation by always requiring userId context
 */

export type InvoiceNotificationType = 
  | "due_in_2_days"   // 2 days before due date
  | "due_tomorrow"    // 1 day before due date
  | "due_today"       // On the due date
  | "overdue";        // After the due date

export type AgendaNotificationType =
  | "event_tomorrow"  // 1 day before the event
  | "event_today";    // On the day of the event

export interface InvoiceNotification {
  invoiceId: string;
  invoiceNum: string;
  clientName: string;
  amount: number;
  dueDate: Date;
  notificationType: InvoiceNotificationType;
  severity: "info" | "warning" | "danger";
  message: string;
}

export interface AgendaNotification {
  eventId: string;
  title: string;
  start: Date;
  notificationType: AgendaNotificationType;
  severity: "info" | "highlight";
  message: string;
}

/**
 * Calculate the notification type for an invoice based on its due date
 * Returns null if no notification is needed
 */
export function getInvoiceNotificationType(
  dueDate: Date,
  now: Date = new Date()
): InvoiceNotificationType | null {
  const dueDateStart = new Date(dueDate);
  dueDateStart.setHours(0, 0, 0, 0);
  
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const diffInMs = dueDateStart.getTime() - todayStart.getTime();
  // Use Math.round to handle any floating point precision issues since both dates are at midnight
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) {
    return "overdue";
  }
  if (diffInDays === 0) {
    return "due_today";
  }
  if (diffInDays === 1) {
    return "due_tomorrow";
  }
  if (diffInDays === 2) {
    return "due_in_2_days";
  }
  
  return null;
}

/**
 * Get severity level for invoice notification type
 */
export function getInvoiceNotificationSeverity(
  type: InvoiceNotificationType
): "info" | "warning" | "danger" {
  switch (type) {
    case "due_in_2_days":
      return "info";
    case "due_tomorrow":
      return "warning";
    case "due_today":
      return "warning";
    case "overdue":
      return "danger";
  }
}

/**
 * Get Dutch message for invoice notification type
 */
export function getInvoiceNotificationMessage(
  type: InvoiceNotificationType,
  invoiceNum: string,
  clientName: string
): string {
  switch (type) {
    case "due_in_2_days":
      return `Factuur ${invoiceNum} van ${clientName} vervalt over 2 dagen`;
    case "due_tomorrow":
      return `Factuur ${invoiceNum} van ${clientName} vervalt morgen`;
    case "due_today":
      return `Factuur ${invoiceNum} van ${clientName} vervalt vandaag`;
    case "overdue":
      return `Factuur ${invoiceNum} van ${clientName} is verlopen`;
  }
}

/**
 * Calculate notification type for an agenda event
 * Returns null if no notification is needed
 */
export function getAgendaNotificationType(
  eventStart: Date,
  now: Date = new Date()
): AgendaNotificationType | null {
  const eventDateStart = new Date(eventStart);
  eventDateStart.setHours(0, 0, 0, 0);
  
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const diffInMs = eventDateStart.getTime() - todayStart.getTime();
  // Use Math.round to handle any floating point precision issues since both dates are at midnight
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return "event_today";
  }
  if (diffInDays === 1) {
    return "event_tomorrow";
  }
  
  return null;
}

/**
 * Get Dutch message for agenda notification
 */
export function getAgendaNotificationMessage(
  type: AgendaNotificationType,
  title: string,
  startTime: Date
): string {
  const timeStr = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(startTime);
  
  switch (type) {
    case "event_today":
      return `Afspraak "${title}" vandaag om ${timeStr}`;
    case "event_tomorrow":
      return `Afspraak "${title}" morgen om ${timeStr}`;
  }
}

/**
 * Get color classes for notification severity
 */
export function getNotificationColorClasses(severity: "info" | "warning" | "danger" | "highlight"): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  switch (severity) {
    case "info":
      return {
        bg: "bg-sky-50 dark:bg-sky-950/30",
        text: "text-sky-700 dark:text-sky-300",
        border: "border-sky-200 dark:border-sky-800",
        icon: "text-sky-500",
      };
    case "warning":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800",
        icon: "text-amber-500",
      };
    case "danger":
      return {
        bg: "bg-rose-50 dark:bg-rose-950/30",
        text: "text-rose-700 dark:text-rose-300",
        border: "border-rose-200 dark:border-rose-800",
        icon: "text-rose-500",
      };
    case "highlight":
      return {
        bg: "bg-purple-50 dark:bg-purple-950/30",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200 dark:border-purple-800",
        icon: "text-purple-500",
      };
  }
}
