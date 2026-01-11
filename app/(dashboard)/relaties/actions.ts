"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/auth/tenant";
import { clientSchema, type ClientFormValues } from "./schema";

export async function getClients() {
  // Non-admin page: always scope by tenant
  const { userId } = await requireTenantContext();

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

  const { userId } = await requireTenantContext();
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
  revalidatePath("/facturen", "layout");
}

export async function deleteClient(clientId: string) {
  "use server";

  const { userId } = await requireTenantContext();

  await prisma.client.deleteMany({
    where: { id: clientId, userId },
  });

  revalidatePath("/relaties");
  revalidatePath("/facturen/nieuw");
  revalidatePath("/facturen", "layout");
}

export async function updateClient(clientId: string, values: ClientFormValues) {
  "use server";

  const { userId } = await requireTenantContext();
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
  revalidatePath("/facturen", "layout");
}
