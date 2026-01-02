"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const timeEntrySchema = z.object({
  date: z.string().min(1, "Datum is verplicht"),
  hours: z.number().positive("Aantal uren moet groter dan 0 zijn"),
  description: z.string().min(1, "Omschrijving is verplicht"),
});

type TimeEntryInput = z.infer<typeof timeEntrySchema>;

export type TimeEntryDto = {
  id: string;
  date: string;
  hours: number;
  description: string;
};

function getYearRange() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  return { startOfYear, endOfYear };
}

export async function logTimeEntry(values: TimeEntryInput) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  const data = timeEntrySchema.parse(values);

  try {
    await prisma.timeEntry.create({
      data: {
        userId,
        description: data.description,
        date: new Date(data.date),
        hours: new Prisma.Decimal(data.hours),
      },
    });

    revalidatePath("/uren");
  } catch (error) {
    console.error("Urenregistratie opslaan mislukt", { error, userId });
    throw new Error("Tijdsregistratie kon niet worden opgeslagen. Controleer de invoer en probeer het opnieuw.");
  }
}

export async function getTimeEntries(): Promise<TimeEntryDto[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  const { startOfYear, endOfYear } = getYearRange();

  try {
    const entries = await prisma.timeEntry.findMany({
      where: { userId, date: { gte: startOfYear, lt: endOfYear } },
      orderBy: { date: "desc" },
    });

    return entries.map((entry) => ({
      id: entry.id,
      description: entry.description,
      date: entry.date.toISOString().split("T")[0],
      hours: Number(entry.hours),
    }));
  } catch (error) {
    console.error("Kon tijdregistraties niet ophalen", { error, userId });
    return [];
  }
}

export async function deleteTimeEntry(id: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }

  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });

    if (!entry || entry.userId !== userId) {
      throw new Error("Tijdregistratie niet gevonden voor deze gebruiker.");
    }

    await prisma.timeEntry.delete({ where: { id } });
    revalidatePath("/uren");
  } catch (error) {
    console.error("Tijdregistratie verwijderen mislukt", { error, id, userId });
    throw new Error("Kon de tijdregistratie niet verwijderen.");
  }
}

export async function getYearlyHours() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  const { startOfYear, endOfYear } = getYearRange();

  try {
    const result = await prisma.timeEntry.aggregate({
      where: { userId, date: { gte: startOfYear, lt: endOfYear } },
      _sum: { hours: true },
    });

    return Number(result._sum.hours ?? 0);
  } catch (error) {
    console.error("Kon totaal aantal uren niet berekenen", { error, userId });
    return 0;
  }
}
