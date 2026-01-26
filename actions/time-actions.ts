"use server";

import { revalidatePath } from "next/cache";
import { Prisma, TimeEntryStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveCompanyContext, requirePermission } from "@/lib/auth/company-context";
import { isTimeAfter, isBreakValid, calculateHoursFromTimes } from "@/lib/time-constants";

const timeEntrySchema = z.object({
  date: z.string().min(1, "Datum is verplicht"),
  hours: z.number().positive("Aantal uren moet groter dan 0 zijn"),
  description: z.string().min(1, "Omschrijving is verplicht"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  breakMinutes: z.number().min(0).optional(),
  workType: z.string().optional(),
  notes: z.string().optional(),
  billable: z.boolean().optional(),
  hourlyRate: z.number().min(0).optional(),
  projectTag: z.string().optional(),
}).refine(
  (data) => {
    // If both start and end time are provided, validate end > start using proper time comparison
    if (data.startTime && data.endTime) {
      return isTimeAfter(data.startTime, data.endTime);
    }
    return true;
  },
  { message: "Eindtijd moet na starttijd liggen", path: ["endTime"] }
).refine(
  (data) => {
    // If times and break are provided, validate break doesn't exceed interval
    if (data.startTime && data.endTime && data.breakMinutes) {
      return isBreakValid(data.startTime, data.endTime, data.breakMinutes);
    }
    return true;
  },
  { message: "Pauze kan niet langer zijn dan de gewerkte tijd", path: ["breakMinutes"] }
);

type TimeEntryInput = z.infer<typeof timeEntrySchema>;

export type TimeEntryDto = {
  id: string;
  date: string;
  hours: number;
  description: string;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number | null;
  workType: string | null;
  notes: string | null;
  billable: boolean;
  hourlyRate: number | null;
  projectTag: string | null;
  status: "RUNNING" | "COMPLETED";
  timerStartedAt: string | null;
  billedAt: string | null;
  invoiceId: string | null;
};

export type RunningTimerDto = {
  id: string;
  description: string;
  workType: string | null;
  projectTag: string | null;
  timerStartedAt: string;
  elapsedMinutes: number;
} | null;

export type WeekSummary = {
  weekNumber: number;
  year: number;
  totalHours: number;
  billableHours: number;
  estimatedAmount: number;
  dayTotals: Record<string, number>; // YYYY-MM-DD -> hours
};

function getYearRange() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  return { startOfYear, endOfYear };
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function logTimeEntry(values: TimeEntryInput) {
  // Require edit permission - accountants need canEdit to add entries
  const context = await requirePermission("canEdit");
  const activeCompanyId = context.activeCompanyId;
  const data = timeEntrySchema.parse(values);

  try {
    // Calculate hours from times if provided
    let hours = data.hours;
    if (data.startTime && data.endTime) {
      hours = calculateHoursFromTimes(data.startTime, data.endTime, data.breakMinutes || 0);
    }

    await prisma.timeEntry.create({
      data: {
        userId: activeCompanyId, // Use active company ID (company owner's user ID)
        description: data.description,
        date: new Date(data.date),
        hours: new Prisma.Decimal(hours),
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        breakMinutes: data.breakMinutes || null,
        workType: data.workType || null,
        notes: data.notes || null,
        billable: data.billable ?? true,
        hourlyRate: data.hourlyRate ? new Prisma.Decimal(data.hourlyRate) : null,
        projectTag: data.projectTag || null,
      },
    });

    revalidatePath("/uren");
  } catch (error) {
    console.error("Urenregistratie opslaan mislukt", { error, activeCompanyId });
    throw new Error("Tijdsregistratie kon niet worden opgeslagen. Controleer de invoer en probeer het opnieuw.");
  }
}

export async function updateTimeEntry(id: string, values: TimeEntryInput) {
  // Require edit permission - accountants need canEdit to update entries
  const context = await requirePermission("canEdit");
  const activeCompanyId = context.activeCompanyId;
  const data = timeEntrySchema.parse(values);

  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });

    if (!entry || entry.userId !== activeCompanyId) {
      throw new Error("Tijdregistratie niet gevonden voor dit bedrijf.");
    }

    // Calculate hours from times if provided
    let hours = data.hours;
    if (data.startTime && data.endTime) {
      hours = calculateHoursFromTimes(data.startTime, data.endTime, data.breakMinutes || 0);
    }

    await prisma.timeEntry.update({
      where: { id },
      data: {
        description: data.description,
        date: new Date(data.date),
        hours: new Prisma.Decimal(hours),
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        breakMinutes: data.breakMinutes || null,
        workType: data.workType || null,
        notes: data.notes || null,
        billable: data.billable ?? true,
        hourlyRate: data.hourlyRate ? new Prisma.Decimal(data.hourlyRate) : null,
        projectTag: data.projectTag || null,
      },
    });

    revalidatePath("/uren");
    return { success: true };
  } catch (error) {
    console.error("Tijdregistratie bijwerken mislukt", { error, id, activeCompanyId });
    throw new Error("Kon de tijdregistratie niet bijwerken.");
  }
}

export async function getTimeEntries(): Promise<TimeEntryDto[]> {
  // Use active company context for multi-tenant support
  const context = await getActiveCompanyContext();
  const activeCompanyId = context.activeCompanyId;
  const { startOfYear, endOfYear } = getYearRange();

  try {
    const entries = await prisma.timeEntry.findMany({
      where: { 
        userId: activeCompanyId, 
        date: { gte: startOfYear, lt: endOfYear },
        status: TimeEntryStatus.COMPLETED, // Only show completed entries
      },
      orderBy: { date: "desc" },
    });

    return entries.map((entry) => ({
      id: entry.id,
      description: entry.description,
      date: entry.date.toISOString().split("T")[0],
      hours: Number(entry.hours),
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakMinutes: entry.breakMinutes,
      workType: entry.workType,
      notes: entry.notes,
      billable: entry.billable,
      hourlyRate: entry.hourlyRate ? Number(entry.hourlyRate) : null,
      projectTag: entry.projectTag,
      status: entry.status,
      timerStartedAt: entry.timerStartedAt?.toISOString() || null,
      billedAt: entry.billedAt?.toISOString() || null,
      invoiceId: entry.invoiceId,
    }));
  } catch (error) {
    console.error("Kon tijdregistraties niet ophalen", { error, activeCompanyId });
    return [];
  }
}

export async function deleteTimeEntry(id: string) {
  // Require edit permission - accountants need canEdit to delete entries
  const context = await requirePermission("canEdit");
  const activeCompanyId = context.activeCompanyId;

  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });

    if (!entry || entry.userId !== activeCompanyId) {
      throw new Error("Tijdregistratie niet gevonden voor dit bedrijf.");
    }

    await prisma.timeEntry.delete({ where: { id } });
    revalidatePath("/uren");
    return { success: true };
  } catch (error) {
    console.error("Tijdregistratie verwijderen mislukt", { error, id, activeCompanyId });
    throw new Error("Kon de tijdregistratie niet verwijderen.");
  }
}

export async function getYearlyHours() {
  // Use active company context for multi-tenant support
  const context = await getActiveCompanyContext();
  const activeCompanyId = context.activeCompanyId;
  const { startOfYear, endOfYear } = getYearRange();

  try {
    const result = await prisma.timeEntry.aggregate({
      where: { userId: activeCompanyId, date: { gte: startOfYear, lt: endOfYear } },
      _sum: { hours: true },
    });

    return Number(result._sum.hours ?? 0);
  } catch (error) {
    console.error("Kon totaal aantal uren niet berekenen", { error, activeCompanyId });
    return 0;
  }
}

export async function getWeekSummaries(): Promise<WeekSummary[]> {
  // Use active company context for multi-tenant support
  const context = await getActiveCompanyContext();
  const activeCompanyId = context.activeCompanyId;
  const { startOfYear, endOfYear } = getYearRange();

  try {
    const entries = await prisma.timeEntry.findMany({
      where: { 
        userId: activeCompanyId, 
        date: { gte: startOfYear, lt: endOfYear },
        status: TimeEntryStatus.COMPLETED, // Only count completed entries
      },
      orderBy: { date: "desc" },
    });

    // Group by week
    const weekMap = new Map<string, WeekSummary>();
    
    for (const entry of entries) {
      const date = entry.date;
      const weekNum = getWeekNumber(date);
      const year = date.getFullYear();
      const weekKey = `${year}-W${weekNum}`;
      const dateKey = date.toISOString().split("T")[0];
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekNumber: weekNum,
          year,
          totalHours: 0,
          billableHours: 0,
          estimatedAmount: 0,
          dayTotals: {},
        });
      }
      
      const weekSummary = weekMap.get(weekKey)!;
      const hours = Number(entry.hours);
      weekSummary.totalHours += hours;
      weekSummary.dayTotals[dateKey] = (weekSummary.dayTotals[dateKey] || 0) + hours;
      
      // Track billable hours and estimated amount
      if (entry.billable) {
        weekSummary.billableHours += hours;
        if (entry.hourlyRate) {
          weekSummary.estimatedAmount += hours * Number(entry.hourlyRate);
        }
      }
    }

    return Array.from(weekMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.weekNumber - a.weekNumber;
    });
  } catch (error) {
    console.error("Kon weekoverzichten niet ophalen", { error, activeCompanyId });
    return [];
  }
}

// =============================================================================
// TIMER FUNCTIONS
// =============================================================================

const timerStartSchema = z.object({
  description: z.string().min(1, "Omschrijving is verplicht"),
  workType: z.string().optional(),
  projectTag: z.string().optional(),
  billable: z.boolean().optional(),
  hourlyRate: z.number().min(0).optional(),
});

type TimerStartInput = z.infer<typeof timerStartSchema>;

/**
 * Get the currently running timer for the active company (if any).
 * Only one timer can be running per user per company.
 */
export async function getRunningTimer(): Promise<RunningTimerDto> {
  const context = await getActiveCompanyContext();
  const activeCompanyId = context.activeCompanyId;

  try {
    const runningEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: activeCompanyId,
        status: TimeEntryStatus.RUNNING,
      },
      select: {
        id: true,
        description: true,
        workType: true,
        projectTag: true,
        timerStartedAt: true,
      },
    });

    if (!runningEntry || !runningEntry.timerStartedAt) {
      return null;
    }

    const now = new Date();
    const elapsedMs = now.getTime() - runningEntry.timerStartedAt.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    return {
      id: runningEntry.id,
      description: runningEntry.description,
      workType: runningEntry.workType,
      projectTag: runningEntry.projectTag,
      timerStartedAt: runningEntry.timerStartedAt.toISOString(),
      elapsedMinutes,
    };
  } catch (error) {
    console.error("Kon lopende timer niet ophalen", { error, activeCompanyId });
    return null;
  }
}

/**
 * Start a new timer. Only one timer can be running per user per company.
 * Creates a RUNNING entry with timerStartedAt=now.
 */
export async function startTimer(values: TimerStartInput) {
  const context = await requirePermission("canEdit");
  const activeCompanyId = context.activeCompanyId;
  const data = timerStartSchema.parse(values);

  try {
    // Check if there's already a running timer
    const existingRunning = await prisma.timeEntry.findFirst({
      where: {
        userId: activeCompanyId,
        status: TimeEntryStatus.RUNNING,
      },
      select: { id: true },
    });

    if (existingRunning) {
      throw new Error("Er loopt al een timer. Stop deze eerst voordat je een nieuwe start.");
    }

    const now = new Date();
    const startTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    await prisma.timeEntry.create({
      data: {
        userId: activeCompanyId,
        description: data.description,
        date: now,
        hours: new Prisma.Decimal(0), // Will be calculated when stopped
        startTime: startTimeStr,
        status: TimeEntryStatus.RUNNING,
        timerStartedAt: now,
        workType: data.workType || null,
        projectTag: data.projectTag || null,
        billable: data.billable ?? true,
        hourlyRate: data.hourlyRate ? new Prisma.Decimal(data.hourlyRate) : null,
      },
    });

    revalidatePath("/uren");
    return { success: true };
  } catch (error) {
    console.error("Timer starten mislukt", { error, activeCompanyId });
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Kon de timer niet starten.");
  }
}

/**
 * Stop the running timer.
 * Sets endTime=now, calculates durationMinutes (end-start-break), and marks as COMPLETED.
 */
export async function stopTimer(breakMinutes: number = 0) {
  const context = await requirePermission("canEdit");
  const activeCompanyId = context.activeCompanyId;

  try {
    const runningEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: activeCompanyId,
        status: TimeEntryStatus.RUNNING,
      },
    });

    if (!runningEntry) {
      throw new Error("Geen lopende timer gevonden.");
    }

    if (!runningEntry.timerStartedAt) {
      throw new Error("Timer heeft geen starttijd.");
    }

    const now = new Date();
    const endTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Calculate duration in minutes
    const elapsedMs = now.getTime() - runningEntry.timerStartedAt.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const netMinutes = Math.max(0, elapsedMinutes - breakMinutes);
    const hours = netMinutes / 60;

    await prisma.timeEntry.update({
      where: { id: runningEntry.id },
      data: {
        endTime: endTimeStr,
        breakMinutes,
        hours: new Prisma.Decimal(Math.round(hours * 100) / 100), // Round to 2 decimals
        status: TimeEntryStatus.COMPLETED,
      },
    });

    revalidatePath("/uren");
    return { success: true, hours: Math.round(hours * 100) / 100 };
  } catch (error) {
    console.error("Timer stoppen mislukt", { error, activeCompanyId });
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Kon de timer niet stoppen.");
  }
}

/**
 * Discard (delete) the running timer without saving.
 */
export async function discardTimer() {
  const context = await requirePermission("canEdit");
  const activeCompanyId = context.activeCompanyId;

  try {
    const runningEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: activeCompanyId,
        status: TimeEntryStatus.RUNNING,
      },
      select: { id: true },
    });

    if (!runningEntry) {
      throw new Error("Geen lopende timer gevonden.");
    }

    await prisma.timeEntry.delete({
      where: { id: runningEntry.id },
    });

    revalidatePath("/uren");
    return { success: true };
  } catch (error) {
    console.error("Timer annuleren mislukt", { error, activeCompanyId });
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Kon de timer niet annuleren.");
  }
}

// =============================================================================
// INVOICE FROM HOURS FUNCTIONS
// =============================================================================

export type ClientBasic = {
  id: string;
  name: string;
};

export type InvoiceFromHoursInput = {
  clientId: string;
  hourlyRate: number;
  description: string;
  grouping: "single" | "per-day" | "per-project";
  timeEntryIds: string[];
  vatRate: "21" | "9" | "0";
};

/**
 * Get all clients for the active company (for dropdown selection)
 */
export async function getClientsForInvoice(): Promise<ClientBasic[]> {
  const context = await getActiveCompanyContext();
  const activeCompanyId = context.activeCompanyId;

  try {
    const clients = await prisma.client.findMany({
      where: { userId: activeCompanyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return clients;
  } catch (error) {
    console.error("Kon klanten niet ophalen", { error, activeCompanyId });
    return [];
  }
}

/**
 * Get unbilled time entries for a specific week
 */
export async function getUnbilledEntriesForWeek(weekNumber: number, year: number): Promise<TimeEntryDto[]> {
  const context = await getActiveCompanyContext();
  const activeCompanyId = context.activeCompanyId;

  try {
    // Calculate week start and end dates
    const jan1 = new Date(year, 0, 1);
    const dayOfWeek = jan1.getDay() || 7; // Make Sunday = 7
    const firstMonday = new Date(jan1);
    firstMonday.setDate(jan1.getDate() + (1 - dayOfWeek + 7) % 7);
    
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: activeCompanyId,
        status: TimeEntryStatus.COMPLETED,
        date: { gte: weekStart, lt: weekEnd },
        billedAt: null, // Only unbilled entries
        billable: true, // Only billable entries
      },
      orderBy: { date: "asc" },
    });

    return entries.map((entry) => ({
      id: entry.id,
      description: entry.description,
      date: entry.date.toISOString().split("T")[0],
      hours: Number(entry.hours),
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakMinutes: entry.breakMinutes,
      workType: entry.workType,
      notes: entry.notes,
      billable: entry.billable,
      hourlyRate: entry.hourlyRate ? Number(entry.hourlyRate) : null,
      projectTag: entry.projectTag,
      status: entry.status,
      timerStartedAt: entry.timerStartedAt?.toISOString() || null,
      billedAt: entry.billedAt?.toISOString() || null,
      invoiceId: entry.invoiceId,
    }));
  } catch (error) {
    console.error("Kon uren niet ophalen", { error, activeCompanyId });
    return [];
  }
}

/**
 * Create an invoice draft from time entries
 * Links the hours to the invoice to prevent double-billing
 */
export async function createInvoiceFromHours(input: InvoiceFromHoursInput) {
  const context = await requirePermission("canEdit");
  const activeCompanyId = context.activeCompanyId;

  try {
    const { clientId, hourlyRate, description, grouping, timeEntryIds, vatRate } = input;

    // Validate input
    if (timeEntryIds.length === 0) {
      throw new Error("Selecteer minimaal één urenregistratie.");
    }

    // Verify all time entries belong to this company and are unbilled
    const entries = await prisma.timeEntry.findMany({
      where: {
        id: { in: timeEntryIds },
        userId: activeCompanyId,
        status: TimeEntryStatus.COMPLETED,
        billedAt: null, // Must be unbilled
      },
    });

    if (entries.length !== timeEntryIds.length) {
      throw new Error("Een of meer urenregistraties zijn al gefactureerd of niet gevonden.");
    }

    // Verify client belongs to this company
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: activeCompanyId },
    });

    if (!client) {
      throw new Error("Klant niet gevonden.");
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { userId: activeCompanyId },
      orderBy: { createdAt: "desc" },
      select: { invoiceNum: true },
    });

    let nextNum = 1;
    if (lastInvoice?.invoiceNum) {
      const match = lastInvoice.invoiceNum.match(/(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    const invoiceNum = `INV-${String(nextNum).padStart(4, "0")}`;

    // Calculate lines based on grouping
    const vatRateMap: Record<string, "HOOG_21" | "LAAG_9" | "NUL_0"> = {
      "21": "HOOG_21",
      "9": "LAAG_9",
      "0": "NUL_0",
    };
    const prismaVatRate = vatRateMap[vatRate];

    type InvoiceLine = {
      description: string;
      quantity: number;
      price: number;
      amount: number;
      vatRate: "HOOG_21" | "LAAG_9" | "NUL_0";
      unit: "UUR";
    };

    let lines: InvoiceLine[] = [];

    if (grouping === "single") {
      // Single line with total hours
      const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
      lines = [{
        description: description || "Gewerkte uren",
        quantity: Math.round(totalHours * 100) / 100,
        price: hourlyRate,
        amount: Math.round(totalHours * hourlyRate * 100) / 100,
        vatRate: prismaVatRate,
        unit: "UUR",
      }];
    } else if (grouping === "per-day") {
      // Group by date
      const byDate = new Map<string, { hours: number; entries: typeof entries }>();
      for (const entry of entries) {
        const dateKey = entry.date.toISOString().split("T")[0];
        if (!byDate.has(dateKey)) {
          byDate.set(dateKey, { hours: 0, entries: [] });
        }
        const group = byDate.get(dateKey)!;
        group.hours += Number(entry.hours);
        group.entries.push(entry);
      }

      lines = Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, { hours }]) => ({
          description: `${description || "Gewerkte uren"} - ${new Date(date).toLocaleDateString("nl-NL")}`,
          quantity: Math.round(hours * 100) / 100,
          price: hourlyRate,
          amount: Math.round(hours * hourlyRate * 100) / 100,
          vatRate: prismaVatRate,
          unit: "UUR" as const,
        }));
    } else if (grouping === "per-project") {
      // Group by project tag
      const byProject = new Map<string, number>();
      for (const entry of entries) {
        const projectKey = entry.projectTag || "Overig";
        byProject.set(projectKey, (byProject.get(projectKey) || 0) + Number(entry.hours));
      }

      lines = Array.from(byProject.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([project, hours]) => ({
          description: `${description || "Gewerkte uren"} - ${project}`,
          quantity: Math.round(hours * 100) / 100,
          price: hourlyRate,
          amount: Math.round(hours * hourlyRate * 100) / 100,
          vatRate: prismaVatRate,
          unit: "UUR" as const,
        }));
    }

    // Create invoice and mark hours as billed in a transaction
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

    const invoice = await prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.invoice.create({
        data: {
          userId: activeCompanyId,
          clientId,
          invoiceNum,
          date: now,
          dueDate,
        },
      });

      await tx.invoiceLine.createMany({
        data: lines.map((line) => ({
          invoiceId: createdInvoice.id,
          description: line.description,
          quantity: new Prisma.Decimal(line.quantity),
          price: new Prisma.Decimal(line.price),
          amount: new Prisma.Decimal(line.amount),
          vatRate: line.vatRate,
          unit: line.unit,
        })),
      });

      // Mark time entries as billed
      await tx.timeEntry.updateMany({
        where: { id: { in: timeEntryIds } },
        data: {
          billedAt: now,
          invoiceId: createdInvoice.id,
        },
      });

      return createdInvoice;
    });

    revalidatePath("/uren");
    revalidatePath("/facturen");

    return { success: true, invoiceId: invoice.id, invoiceNum };
  } catch (error) {
    console.error("Factuur maken mislukt", { error, activeCompanyId });
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Kon de factuur niet maken.");
  }
}
