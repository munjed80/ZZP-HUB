"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SetupPayload = {
  companyName: string;
  kvkNumber?: string | null;
};

export async function completeProfileSetup(values: SetupPayload) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return { success: false, message: "Niet geauthenticeerd" };
  }

  const companyName = values.companyName?.trim() ?? "";
  const kvkNumber = values.kvkNumber?.trim() ?? "";

  if (!companyName) {
    return { success: false, message: "Bedrijfsnaam is verplicht" };
  }

  const existingProfile = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
  });

  const baseProfile = {
    address: existingProfile?.address ?? "",
    postalCode: existingProfile?.postalCode ?? "",
    city: existingProfile?.city ?? "",
    btwNumber: existingProfile?.btwNumber ?? "",
    iban: existingProfile?.iban ?? "",
    bankName: existingProfile?.bankName ?? "",
    paymentTerms: existingProfile?.paymentTerms ?? "14 dagen",
  };

  if (existingProfile) {
    await prisma.companyProfile.update({
      where: { userId: session.user.id },
      data: {
        ...baseProfile,
        companyName,
        kvkNumber,
      },
    });
  } else {
    await prisma.companyProfile.create({
      data: {
        userId: session.user.id,
        companyName,
        kvkNumber,
        ...baseProfile,
      },
    });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true, onboardingStep: 5 },
  });

  // Help middleware pick up the updated status immediately
  cookies().set("zzp-hub-onboarding-completed", "true", {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  revalidatePath("/dashboard");
  revalidatePath("/setup");

  return { success: true };
}
