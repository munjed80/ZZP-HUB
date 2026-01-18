"use server";

import { revalidatePath } from "next/cache";
import { setActiveCompanyId, clearActiveCompanyId } from "@/lib/auth/company-context";

/**
 * Switch to a different company context (for accountants)
 */
export async function switchCompanyContext(companyId: string) {
  try {
    await setActiveCompanyId(companyId);
    
    // Revalidate all relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/facturen");
    revalidatePath("/relaties");
    revalidatePath("/offertes");
    revalidatePath("/uitgaven");
    revalidatePath("/btw-aangifte");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error switching company context:", error);
    const message = error instanceof Error ? error.message : "Fout bij wisselen van bedrijf";
    return { success: false, message };
  }
}

/**
 * Clear company context (return to default)
 */
export async function clearCompanyContext() {
  try {
    await clearActiveCompanyId();
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error clearing company context:", error);
    return { success: false };
  }
}
