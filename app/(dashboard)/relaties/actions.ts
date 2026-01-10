"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, requireUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { clientSchema, type ClientFormValues } from "./schema";

export async function getClients() {
  const { id: userId, role } = await requireUser();

  try {
    return await prisma.client.findMany({
      where: role === UserRole.SUPERADMIN ? {} : { userId },
    });
  } catch (error) {
    console.error("Kon klanten niet ophalen", error);
    return [];
  }
}

export async function createClient(values: ClientFormValues) {
  "use server";

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  const data = clientSchema.parse(values);

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

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }

  await prisma.client.deleteMany({
    where: { id: clientId, userId },
  });

  revalidatePath("/relaties");
  revalidatePath("/facturen/nieuw");
}

export async function updateClient(clientId: string, values: ClientFormValues) {
  "use server";

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  const data = clientSchema.parse(values);

  await prisma.client.updateMany({
    where: { id: clientId, userId },
    data: {
      name: data.name,
      email: data.email,
      address: data.address,
      postalCode: data.postalCode,
      city: data.city,
      kvkNumber: data.kvkNumber || null,
      btwId: data.btwId || null,
    },
  });

  revalidatePath("/relaties");
  revalidatePath("/facturen/nieuw");
}
