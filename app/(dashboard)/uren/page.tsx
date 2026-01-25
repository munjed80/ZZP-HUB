import { getTimeEntries, getYearlyHours } from "@/actions/time-actions";
import { UrenClient } from "./uren-client";
import { requireOwnerPage } from "@/lib/auth/route-guards";

export default async function UrenPagina() {
  // Owner-only page guard
  await requireOwnerPage();
  
  const [entries, totalHours] = await Promise.all([getTimeEntries(), getYearlyHours()]);

  return <UrenClient entries={entries} totalHours={totalHours} />;
}
