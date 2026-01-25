"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
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
};

export type WeekSummary = {
  weekNumber: number;
  year: number;
  totalHours: number;
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
      where: { userId: activeCompanyId, date: { gte: startOfYear, lt: endOfYear } },
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
      where: { userId: activeCompanyId, date: { gte: startOfYear, lt: endOfYear } },
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
          dayTotals: {},
        });
      }
      
      const weekSummary = weekMap.get(weekKey)!;
      const hours = Number(entry.hours);
      weekSummary.totalHours += hours;
      weekSummary.dayTotals[dateKey] = (weekSummary.dayTotals[dateKey] || 0) + hours;
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
