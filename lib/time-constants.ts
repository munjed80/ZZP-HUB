// Work type options for time entries
export const WORK_TYPES = ["Project", "Klant", "Intern", "Administratie", "Overig"] as const;
export type WorkType = typeof WORK_TYPES[number];

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Compare two time strings, returning true if endTime is after startTime.
 * Note: For simplicity, this doesn't handle overnight shifts.
 */
export function isTimeAfter(startTime: string, endTime: string): boolean {
  return parseTimeToMinutes(endTime) > parseTimeToMinutes(startTime);
}

/**
 * Calculate hours from start/end time and break
 * Returns 0 if invalid (overnight shifts not supported in this simple version)
 */
export function calculateHoursFromTimes(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);
  
  // Don't support overnight shifts - return 0 if end is before start
  if (endMins <= startMins) {
    return 0;
  }
  
  const totalMinutes = endMins - startMins - breakMinutes;
  return Math.max(0, totalMinutes / 60);
}

/**
 * Check if break exceeds the worked interval
 */
export function isBreakValid(startTime: string, endTime: string, breakMinutes: number): boolean {
  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);
  const totalMinutes = endMins - startMins;
  return breakMinutes < totalMinutes && breakMinutes >= 0;
}
