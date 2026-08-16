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

/**
 * Adds whole calendar months to a "YYYY-MM-DD" string, clamping to the last
 * valid day of the target month when the origin day doesn't exist there.
 * Pure string arithmetic — no timezone or clock reads, consistent with the
 * rest of this module.
 *
 * Calendar-month semantics (design doc §3), NOT a flat 30-day estimate:
 *   addCalendarMonths('2026-01-31', 3) === '2026-04-30'  (Apr has no 31st → clamped)
 *   addCalendarMonths('2026-01-31', 1) === '2026-02-28'  (Feb 2026 non-leap → clamped)
 *   addCalendarMonths('2024-01-31', 1) === '2024-02-29'  (Feb 2024 leap → clamped to 29)
 *   addCalendarMonths('2026-03-15', 6) === '2026-09-15'  (day exists → preserved)
 *
 * This matches how product labels and vets communicate duration, and how JS's
 * native Date would OVERFLOW (Jan 31 + 1mo → Mar 3) if left unclamped.
 */
export function addCalendarMonths(dateString: string, months: number): string {
  const [year, month, day] = dateString.split('-').map(Number);

  // month is 1-based here; shift to a 0-based absolute month count to add cleanly.
  const zeroBasedMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(zeroBasedMonthIndex / 12);
  // JS modulo can go negative for negative inputs; normalise into 0..11.
  const targetMonthIndex = ((zeroBasedMonthIndex % 12) + 12) % 12;

  // Day 0 of the *next* month resolves to the last day of the target month,
  // giving us that month's length (28/29/30/31) to clamp against.
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  const mm = String(targetMonthIndex + 1).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
}