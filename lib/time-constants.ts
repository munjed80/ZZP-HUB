// Work type options for time entries
export const WORK_TYPES = ["Project", "Klant", "Intern", "Administratie", "Overig"] as const;
export type WorkType = typeof WORK_TYPES[number];
