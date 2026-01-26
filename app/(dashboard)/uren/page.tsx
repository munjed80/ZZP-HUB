import { getTimeEntries, getYearlyHours, getWeekSummaries, getRunningTimer } from "@/actions/time-actions";
import { UrenClient } from "./uren-client";
import { requireReadPage } from "@/lib/auth/route-guards";
import { hasPermission } from "@/lib/auth/company-context";

export default async function UrenPagina() {
  // Require read permission (owners have all permissions, accountants need canRead)
  await requireReadPage();
  
  // Check permissions for accountant context
  const [canEdit, canExport] = await Promise.all([
    hasPermission("canEdit"),
    hasPermission("canExport"),
  ]);
  
  const [entries, totalHours, weekSummaries, runningTimer] = await Promise.all([
    getTimeEntries(),
    getYearlyHours(),
    getWeekSummaries(),
    getRunningTimer(),
  ]);

  return (
    <UrenClient
      entries={entries}
      totalHours={totalHours}
      weekSummaries={weekSummaries}
      runningTimer={runningTimer}
      canEdit={canEdit}
      canExport={canExport}
    />
  );
}
