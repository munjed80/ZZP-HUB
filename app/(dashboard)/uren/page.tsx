import { getTimeEntries, getYearlyHours } from "@/actions/time-actions";
import { UrenClient } from "./uren-client";

export default async function UrenPagina() {
  const [entries, totalHours] = await Promise.all([getTimeEntries(), getYearlyHours()]);

  return <UrenClient entries={entries} totalHours={totalHours} />;
}
