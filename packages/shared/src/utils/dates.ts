const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Converts a "YYYY-MM-DD" string into a fixed numeric position for pure
 * day-count arithmetic. This does NOT interpret timezone or read the clock
 */
function toDayAnchor(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Whole number of calendar days between two "YYYY-MM-DD" strings (end minus start). */
export function diffCalendarDays(startDateString: string, endDateString: string): number {
  return Math.floor((toDayAnchor(endDateString) - toDayAnchor(startDateString)) / MS_PER_DAY);
}

/** Adds (or subtracts, if negative) whole calendar days to a "YYYY-MM-DD" string. */
export function addCalendarDays(dateString: string, days: number): string {
  const anchor = toDayAnchor(dateString) + days * MS_PER_DAY;
  const d = new Date(anchor);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Number of inclusive calendar days from start through end, where day 1 = start.
// inclusiveDaySpan('2026-07-31', '2026-08-11') === 12
export function inclusiveDaySpan(startDateString: string, endDateString: string): number {
  return diffCalendarDays(startDateString, endDateString) + 1;
}

// The last calendar day of a `dayCount`-day inclusive span starting at startDate.
// A count of N inclusive days starting at D ends on D + (N - 1).
// Math.max(0, …) guards a 0-count from producing a date before the start.
// lastDayOfSpan('2026-07-31', 12) === '2026-08-11'
export function lastDayOfSpan(startDateString: string, dayCount: number): string {
  return addCalendarDays(startDateString, Math.max(0, dayCount - 1));
}

/** Converts a Date instant to a "YYYY-MM-DD" string, anchored to UTC. Server-side default/fallback only — for a user's local date, use their stored IANA timezone instead. */
export function toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
}