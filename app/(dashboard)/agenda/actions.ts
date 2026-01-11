"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/auth/tenant";

const eventSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  description: z.string().max(500).optional(),
  start: z.string().min(1, "Startdatum is verplicht"),
  end: z.string().min(1, "Einddatum is verplicht"),
});

export type EventFormValues = z.infer<typeof eventSchema>;

export async function getEvents() {
  const { userId } = await requireTenantContext();

  try {
    return await prisma.event.findMany({
      where: { userId },
      orderBy: { start: "asc" },
    });
  } catch (error) {
    console.error("Kon afspraken niet ophalen", { error, userId });
    return [];
  }
}

export async function createEvent(values: EventFormValues) {
  const { userId } = await requireTenantContext();

  const data = eventSchema.parse(values);
  const startDate = new Date(data.start);
  const endDate = new Date(data.end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { success: false, message: "Ongeldige datum of tijd." };
  }
  if (endDate < startDate) {
    return { success: false, message: "Eindtijd moet na starttijd liggen." };
  }

  try {
    const created = await prisma.event.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });

    revalidatePath("/agenda");
    return { success: true, event: created };
  } catch (error) {
    console.error("AGENDA_SAVE_ERROR:", {
      error,
      userId,
      payload: { title: data.title, start: data.start, end: data.end },
    });
    return { success: false, message: "Opslaan van de afspraak is mislukt." };
  }
}
