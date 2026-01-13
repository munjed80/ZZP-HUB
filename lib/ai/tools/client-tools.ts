import { prisma } from "@/lib/prisma";
import type { CreateClientAction } from "../schemas/actions";

interface ToolContext {
  userId: string;
}

/**
 * Get client by name (fuzzy search)
 */
export async function toolGetClientByName(
  clientName: string,
  context: ToolContext
) {
  const { userId } = context;

  const clients = await prisma.client.findMany({
    where: {
      userId,
      name: {
        contains: clientName,
        mode: "insensitive",
      },
    },
    take: 5,
  });

  return {
    success: true,
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      city: c.city,
    })),
    found: clients.length > 0,
  };
}

/**
 * Create a new client if missing
 */
export async function toolCreateClientIfMissing(
  action: CreateClientAction,
  context: ToolContext
) {
  const { userId } = context;

  // Check if client already exists
  const existing = await prisma.client.findFirst({
    where: {
      userId,
      OR: [
        { name: { equals: action.name, mode: "insensitive" } },
        { email: action.email },
      ],
    },
  });

  if (existing) {
    return {
      success: true,
      alreadyExists: true,
      client: existing,
      message: `Client "${existing.name}" already exists.`,
    };
  }

  // Create new client
  const client = await prisma.client.create({
    data: {
      userId,
      name: action.name,
      email: action.email,
      address: action.address || "",
      postalCode: action.postalCode || "",
      city: action.city || "",
      kvkNumber: action.kvkNumber,
      btwId: action.btwId,
    },
  });

  return {
    success: true,
    alreadyExists: false,
    client,
    message: `Client "${client.name}" created successfully.`,
  };
}
