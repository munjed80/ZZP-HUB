"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReleaseCategory, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const releaseSchema = z.object({
  version: z.string().min(1, "Versie is verplicht"),
  title: z.string().min(1, "Titel is verplicht"),
  description: z.string().min(1, "Beschrijving is verplicht"),
  category: z.nativeEnum(ReleaseCategory, { required_error: "Categorie is verplicht" }),
  isPublished: z.boolean().default(false),
  releaseDate: z.string().optional(),
});

async function assertSuperAdmin() {
  const sessionUser = await requireUser();
  if (sessionUser.role !== UserRole.SUPERADMIN) {
    throw new Error("Alleen SuperAdmins hebben toegang tot deze actie.");
  }
}

export async function listReleases() {
  await assertSuperAdmin();
  return prisma.release.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createRelease(data: unknown) {
  await assertSuperAdmin();
  const parsed = releaseSchema.parse(data);

  const exists = await prisma.release.findUnique({ where: { version: parsed.version } });
  if (exists) {
    return { success: false, message: "Deze versie bestaat al." };
  }

  await prisma.release.create({
    data: {
      version: parsed.version,
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      isPublished: parsed.isPublished,
      releaseDate: parsed.releaseDate ? new Date(parsed.releaseDate) : null,
    },
  });

  revalidatePath("/admin/releases");
  return { success: true };
}

export async function updateRelease(releaseId: string, data: unknown) {
  await assertSuperAdmin();
  const parsed = releaseSchema.parse(data);

  const release = await prisma.release.findUnique({ where: { id: releaseId } });
  if (!release) {
    return { success: false, message: "Release niet gevonden." };
  }

  await prisma.release.update({
    where: { id: releaseId },
    data: {
      version: parsed.version,
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      isPublished: parsed.isPublished,
      releaseDate: parsed.releaseDate ? new Date(parsed.releaseDate) : null,
    },
  });

  revalidatePath("/admin/releases");
  return { success: true };
}

export async function deleteRelease(releaseId: string) {
  await assertSuperAdmin();
  
  const release = await prisma.release.findUnique({ where: { id: releaseId } });
  if (!release) {
    return { success: false, message: "Release niet gevonden." };
  }

  await prisma.release.delete({ where: { id: releaseId } });

  revalidatePath("/admin/releases");
  return { success: true };
}

export async function toggleReleasePublished(releaseId: string, isPublished: boolean) {
  await assertSuperAdmin();
  
  await prisma.release.update({
    where: { id: releaseId },
    data: { 
      isPublished,
      releaseDate: isPublished && !await prisma.release.findUnique({ 
        where: { id: releaseId }, 
        select: { releaseDate: true } 
      }).then(r => r?.releaseDate) ? new Date() : undefined
    },
  });
  
  revalidatePath("/admin/releases");
  return { success: true };
}
