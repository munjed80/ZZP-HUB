import { getTimeEntries, getYearlyHours, getWeekSummaries } from "@/actions/time-actions";
import { UrenClient } from "./uren-client";
import { requireReadPage } from "@/lib/auth/route-guards";
import { hasPermission } from "@/lib/auth/company-context";

export default async function UrenPagina() {
  // Require read permission (owners have all permissions, accountants need canRead)
  await requireReadPage();
  
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
