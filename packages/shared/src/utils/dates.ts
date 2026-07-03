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