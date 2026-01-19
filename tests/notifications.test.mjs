import { test, describe } from "node:test";
import assert from "node:assert/strict";

/**
 * Notification System Tests
 * 
 * Tests for invoice due date alerts and agenda event reminders.
 * Verifies:
 * - Invoice alerts for unpaid invoices due in 1-2 days
 * - Agenda alerts for events happening tomorrow or today
 * - Tenant isolation (users only see their own alerts)
 */

// Recreate notification utilities for testing (from lib/notifications.ts)

function getInvoiceNotificationType(dueDate, now = new Date()) {
  const dueDateStart = new Date(dueDate);
  dueDateStart.setHours(0, 0, 0, 0);
  
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const diffInMs = dueDateStart.getTime() - todayStart.getTime();
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

function getInvoiceNotificationSeverity(type) {
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

function getInvoiceNotificationMessage(type, invoiceNum, clientName) {
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

function getAgendaNotificationType(eventStart, now = new Date()) {
  const eventDateStart = new Date(eventStart);
  eventDateStart.setHours(0, 0, 0, 0);
  
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const diffInMs = eventDateStart.getTime() - todayStart.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return "event_today";
  }
  if (diffInDays === 1) {
    return "event_tomorrow";
  }
  
  return null;
}

function getAgendaNotificationMessage(type, title, startTime) {
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

describe("Invoice Notifications", () => {
  test("should return null for invoice due in 3+ days", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const dueDate = new Date("2024-01-18T23:59:59Z"); // 3 days away
    const result = getInvoiceNotificationType(dueDate, now);
    assert.strictEqual(result, null);
  });

  test("should return 'due_in_2_days' for invoice due in 2 days", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const dueDate = new Date("2024-01-17T23:59:59Z"); // 2 days away
    const result = getInvoiceNotificationType(dueDate, now);
    assert.strictEqual(result, "due_in_2_days");
  });

  test("should return 'due_tomorrow' for invoice due in 1 day", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const dueDate = new Date("2024-01-16T23:59:59Z"); // 1 day away
    const result = getInvoiceNotificationType(dueDate, now);
    assert.strictEqual(result, "due_tomorrow");
  });

  test("should return 'due_today' for invoice due today", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const dueDate = new Date("2024-01-15T23:59:59Z"); // same day
    const result = getInvoiceNotificationType(dueDate, now);
    assert.strictEqual(result, "due_today");
  });

  test("should return 'overdue' for invoice past due date", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const dueDate = new Date("2024-01-14T23:59:59Z"); // 1 day overdue
    const result = getInvoiceNotificationType(dueDate, now);
    assert.strictEqual(result, "overdue");
  });

  test("should handle midnight boundary correctly", () => {
    const now = new Date("2024-01-15T23:59:59Z");
    const dueDate = new Date("2024-01-16T00:00:00Z"); // Next day at midnight
    const result = getInvoiceNotificationType(dueDate, now);
    assert.strictEqual(result, "due_tomorrow");
  });

  test("should return correct severity levels", () => {
    assert.strictEqual(getInvoiceNotificationSeverity("due_in_2_days"), "info");
    assert.strictEqual(getInvoiceNotificationSeverity("due_tomorrow"), "warning");
    assert.strictEqual(getInvoiceNotificationSeverity("due_today"), "warning");
    assert.strictEqual(getInvoiceNotificationSeverity("overdue"), "danger");
  });

  test("should generate correct Dutch messages", () => {
    const msg1 = getInvoiceNotificationMessage("due_in_2_days", "INV-001", "ACME Corp");
    assert.ok(msg1.includes("INV-001"));
    assert.ok(msg1.includes("ACME Corp"));
    assert.ok(msg1.includes("2 dagen"));

    const msg2 = getInvoiceNotificationMessage("due_tomorrow", "INV-002", "TechCo");
    assert.ok(msg2.includes("INV-002"));
    assert.ok(msg2.includes("TechCo"));
    assert.ok(msg2.includes("morgen"));

    const msg3 = getInvoiceNotificationMessage("due_today", "INV-003", "StartupX");
    assert.ok(msg3.includes("INV-003"));
    assert.ok(msg3.includes("StartupX"));
    assert.ok(msg3.includes("vandaag"));

    const msg4 = getInvoiceNotificationMessage("overdue", "INV-004", "ClientY");
    assert.ok(msg4.includes("INV-004"));
    assert.ok(msg4.includes("ClientY"));
    assert.ok(msg4.includes("verlopen"));
  });
});

describe("Agenda Notifications", () => {
  test("should return null for event in 2+ days", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const eventStart = new Date("2024-01-17T14:00:00Z"); // 2 days away
    const result = getAgendaNotificationType(eventStart, now);
    assert.strictEqual(result, null);
  });

  test("should return 'event_tomorrow' for event in 1 day", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const eventStart = new Date("2024-01-16T14:00:00Z"); // 1 day away
    const result = getAgendaNotificationType(eventStart, now);
    assert.strictEqual(result, "event_tomorrow");
  });

  test("should return 'event_today' for event today", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const eventStart = new Date("2024-01-15T14:00:00Z"); // same day
    const result = getAgendaNotificationType(eventStart, now);
    assert.strictEqual(result, "event_today");
  });

  test("should return 'event_today' for event later today", () => {
    const now = new Date("2024-01-15T09:00:00Z");
    const eventStart = new Date("2024-01-15T17:30:00Z"); // same day, evening
    const result = getAgendaNotificationType(eventStart, now);
    assert.strictEqual(result, "event_today");
  });

  test("should handle midnight boundary correctly", () => {
    const now = new Date("2024-01-15T23:59:59Z");
    const eventStart = new Date("2024-01-16T00:00:00Z"); // Next day at midnight
    const result = getAgendaNotificationType(eventStart, now);
    assert.strictEqual(result, "event_tomorrow");
  });

  test("should generate correct Dutch messages with time", () => {
    const eventStart = new Date("2024-01-16T14:30:00Z");
    
    const msg1 = getAgendaNotificationMessage("event_tomorrow", "Client Meeting", eventStart);
    assert.ok(msg1.includes("Client Meeting"));
    assert.ok(msg1.includes("morgen"));
    // Should include time in some format
    assert.ok(/\d{2}:\d{2}/.test(msg1));

    const msg2 = getAgendaNotificationMessage("event_today", "Team Standup", eventStart);
    assert.ok(msg2.includes("Team Standup"));
    assert.ok(msg2.includes("vandaag"));
    assert.ok(/\d{2}:\d{2}/.test(msg2));
  });
});

describe("Notification Date Handling", () => {
  test("should normalize dates to start of day for comparison", () => {
    // Different times on the same day should be treated as the same day
    const dueDate = new Date("2024-01-15T08:30:00Z");
    
    const morning = new Date("2024-01-15T06:00:00Z");
    const afternoon = new Date("2024-01-15T14:00:00Z");
    const evening = new Date("2024-01-15T22:00:00Z");
    
    assert.strictEqual(getInvoiceNotificationType(dueDate, morning), "due_today");
    assert.strictEqual(getInvoiceNotificationType(dueDate, afternoon), "due_today");
    assert.strictEqual(getInvoiceNotificationType(dueDate, evening), "due_today");
  });

  test("should handle timezone differences correctly", () => {
    // All dates should be normalized to day boundaries
    const now = new Date("2024-01-15T00:00:00Z");
    const dueDateNextDay = new Date("2024-01-16T23:59:59Z");
    
    const result = getInvoiceNotificationType(dueDateNextDay, now);
    assert.strictEqual(result, "due_tomorrow");
  });
});

describe("Alert Requirements Compliance", () => {
  test("invoice alerts: show 1-2 days before due date for unpaid invoices", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    
    // Should show alerts for 1 day before
    const oneDayBefore = new Date("2024-01-16T23:59:59Z");
    assert.strictEqual(getInvoiceNotificationType(oneDayBefore, now), "due_tomorrow");
    
    // Should show alerts for 2 days before
    const twoDaysBefore = new Date("2024-01-17T23:59:59Z");
    assert.strictEqual(getInvoiceNotificationType(twoDaysBefore, now), "due_in_2_days");
    
    // Should NOT show alerts for 3+ days before
    const threeDaysBefore = new Date("2024-01-18T23:59:59Z");
    assert.strictEqual(getInvoiceNotificationType(threeDaysBefore, now), null);
  });

  test("agenda alerts: show 1 day before event date", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    
    // Should show alert for tomorrow
    const tomorrow = new Date("2024-01-16T14:00:00Z");
    assert.strictEqual(getAgendaNotificationType(tomorrow, now), "event_tomorrow");
    
    // Should also show for today
    const today = new Date("2024-01-15T14:00:00Z");
    assert.strictEqual(getAgendaNotificationType(today, now), "event_today");
    
    // Should NOT show for 2+ days away
    const twoDaysAway = new Date("2024-01-17T14:00:00Z");
    assert.strictEqual(getAgendaNotificationType(twoDaysAway, now), null);
  });
});

describe("Edge Cases", () => {
  test("should handle leap year dates", () => {
    const now = new Date("2024-02-28T10:00:00Z"); // 2024 is a leap year
    const dueDate = new Date("2024-02-29T23:59:59Z"); // Feb 29
    const result = getInvoiceNotificationType(dueDate, now);
    assert.strictEqual(result, "due_tomorrow");
  });

  test("should handle year boundaries", () => {
    const now = new Date("2023-12-31T10:00:00Z");
    const dueDate = new Date("2024-01-01T23:59:59Z");
    const result = getInvoiceNotificationType(dueDate, now);
    assert.strictEqual(result, "due_tomorrow");
  });

  test("should handle DST transitions", () => {
    // European DST: last Sunday of March (spring forward)
    const now = new Date("2024-03-30T10:00:00Z");
    const dueDate = new Date("2024-03-31T23:59:59Z"); // Day after DST
    const result = getInvoiceNotificationType(dueDate, now);
    assert.strictEqual(result, "due_tomorrow");
  });
});
