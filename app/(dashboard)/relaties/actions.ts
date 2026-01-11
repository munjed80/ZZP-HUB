"use server";

import { revalidatePath } from "next/cache";
import { tenantPrisma } from "@/lib/prismaTenant";
import { getCurrentUserId, requireUser } from "@/lib/auth";
import { clientSchema, type ClientFormValues } from "./schema";

export async function getClients() {
  await requireUser();

  try {
    return await tenantPrisma.client.findMany({});
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

  await tenantPrisma.client.create({
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

  await getCurrentUserId();

  await tenantPrisma.client.delete({
    where: { id: clientId },
  });

  revalidatePath("/relaties");
  revalidatePath("/facturen/nieuw");
}

export async function updateClient(clientId: string, values: ClientFormValues) {
  "use server";

  await getCurrentUserId();
  const data = clientSchema.parse(values);

  await tenantPrisma.client.update({
    where: { id: clientId },
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
