"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { clientSchema, type ClientFormValues } from "./schema";

async function ensureUser(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: "demo@zzp-hub.nl",
      passwordHash: "demo-placeholder-hash",
      naam: "Demo gebruiker",
    },
  });
}

export async function getClients() {
  const userId = getCurrentUserId();

  try {
    return await prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Kon klanten niet ophalen", error);
    return [];
  }
}

export async function createClient(values: ClientFormValues) {
  "use server";

  const userId = getCurrentUserId();
  const data = clientSchema.parse(values);

  await ensureUser(userId);

  await prisma.client.create({
    data: {
      name: data.name,
      email: data.email,
      address: data.address,
      postalCode: data.postalCode,
      city: data.city,
      kvkNumber: data.kvkNumber || null,
      btwId: data.btwId || null,
      userId,
    },
  });

  revalidatePath("/relaties");
  revalidatePath("/facturen/nieuw");
}

export async function deleteClient(clientId: string) {
  "use server";

  const userId = getCurrentUserId();

  await prisma.client.deleteMany({
    where: { id: clientId, userId },
  });

  revalidatePath("/relaties");
  revalidatePath("/facturen/nieuw");
}
