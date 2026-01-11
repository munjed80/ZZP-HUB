"use server";

import { revalidatePath } from "next/cache";
import { Prisma, SupportMessageStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/tenant";
import { UserRole } from "@prisma/client";

async function assertSuperAdmin() {
  await requireRole(UserRole.SUPERADMIN);
}

export async function listSupportMessages(filters: { status?: SupportMessageStatus; query?: string }) {
  await assertSuperAdmin();

  const where: Prisma.SupportMessageWhereInput = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.query?.trim()) {
    where.OR = [
      { subject: { contains: filters.query, mode: "insensitive" } },
      { email: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  return prisma.supportMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function getSupportMessage(id: string) {
  await assertSuperAdmin();

  const message = await prisma.supportMessage.findUnique({ where: { id } });
  if (!message) {
    return null;
  }

  if (message.status === SupportMessageStatus.NEW) {
    const updated = await prisma.supportMessage.update({
      where: { id },
      data: { status: SupportMessageStatus.READ },
    });
    revalidatePath("/admin/support");
    return updated;
  }

  return message;
}

export async function setSupportMessageStatus(id: string, status: SupportMessageStatus) {
  await assertSuperAdmin();
  await prisma.supportMessage.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
  return { success: true };
}
