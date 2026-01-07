"use server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOnboardingStep(step: number) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return { success: false, message: "Niet geauthenticeerd" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStep: step },
    });

    revalidatePath("/onboarding");
    return { success: true };
  } catch (error) {
    console.error("Failed to update onboarding step:", error);
    return { success: false, message: "Er ging iets mis" };
  }
}

export async function completeOnboarding() {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return { success: false, message: "Niet geauthenticeerd" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        onboardingStep: 5,
        onboardingCompleted: true,
      },
    });

    revalidatePath("/onboarding");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete onboarding:", error);
    return { success: false, message: "Er ging iets mis" };
  }
}

interface CompanyData {
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  bankName: string;
}

export async function saveCompanyProfile(data: CompanyData) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return { success: false, message: "Niet geauthenticeerd" };
    }

    // Check if profile exists
    const existing = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      await prisma.companyProfile.update({
        where: { userId: session.user.id },
        data: {
          companyName: data.companyName,
          address: data.address,
          postalCode: data.postalCode,
          city: data.city,
          kvkNumber: data.kvkNumber,
          btwNumber: data.btwNumber,
          iban: data.iban,
          bankName: data.bankName,
          paymentTerms: "14 dagen",
        },
      });
    } else {
      await prisma.companyProfile.create({
        data: {
          userId: session.user.id,
          companyName: data.companyName,
          address: data.address,
          postalCode: data.postalCode,
          city: data.city,
          kvkNumber: data.kvkNumber,
          btwNumber: data.btwNumber,
          iban: data.iban,
          bankName: data.bankName,
          paymentTerms: "14 dagen",
        },
      });
    }

    await updateOnboardingStep(3);
    return { success: true };
  } catch (error) {
    console.error("Failed to save company profile:", error);
    return { success: false, message: "Er ging iets mis bij het opslaan" };
  }
}

interface ClientData {
  name: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  btwId?: string;
}

export async function saveFirstClient(data: ClientData) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return { success: false, message: "Niet geauthenticeerd" };
    }

    await prisma.client.create({
      data: {
        userId: session.user.id,
        name: data.name,
        email: data.email,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        btwId: data.btwId || "",
      },
    });

    await updateOnboardingStep(4);
    return { success: true };
  } catch (error) {
    console.error("Failed to save first client:", error);
    return { success: false, message: "Er ging iets mis bij het opslaan" };
  }
}

export async function enable2FA(secret: string, recoveryCodes: string[]) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return { success: false, message: "Niet geauthenticeerd" };
    }

    // Hash recovery codes before storing
    const bcrypt = await import('bcryptjs');
    const hashedCodes = await Promise.all(
      recoveryCodes.map(code => bcrypt.hash(code, 10))
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        recoveryCodes: JSON.stringify(hashedCodes),
      },
    });

    await updateOnboardingStep(5);
    return { success: true };
  } catch (error) {
    console.error("Failed to enable 2FA:", error);
    return { success: false, message: "Er ging iets mis bij het opslaan" };
  }
}

export async function skip2FA() {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return { success: false, message: "Niet geauthenticeerd" };
    }

    await updateOnboardingStep(5);
    return { success: true };
  } catch (error) {
    console.error("Failed to skip 2FA:", error);
    return { success: false, message: "Er ging iets mis" };
  }
}
