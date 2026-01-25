import { getTimeEntries, getYearlyHours, getWeekSummaries } from "@/actions/time-actions";
import { UrenClient } from "./uren-client";
import { requireOwnerPage } from "@/lib/auth/route-guards";
import { hasPermission } from "@/lib/auth/company-context";

export default async function UrenPagina() {
  // Owner-only page guard
  await requireOwnerPage();
  
  // Check if user can edit (for accountant context)
  const canEdit = await hasPermission("canEdit");
  
  const [entries, totalHours, weekSummaries] = await Promise.all([
    getTimeEntries(),
    getYearlyHours(),
    getWeekSummaries(),
  ]);

  return (
    <UrenClient
      entries={entries}
      totalHours={totalHours}
      weekSummaries={weekSummaries}
      canEdit={canEdit}
    />
  );
}
