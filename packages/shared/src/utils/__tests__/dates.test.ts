import { describe, it, expect } from 'vitest';
import { toDateString, diffCalendarDays, addCalendarDays } from '../dates';

describe('toDateString', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(toDateString(new Date('2026-07-17T12:00:00.000Z'))).toBe('2026-07-17');
  });

  it('is UTC-anchored, not local-time-anchored, near a UTC day boundary', () => {
    // 23:30 UTC on the 17th — if this were local-time-anchored on a server
    // running behind UTC, it could roll to the 16th. It must not.
    expect(toDateString(new Date('2026-07-17T23:30:00.000Z'))).toBe('2026-07-17');
    // 00:30 UTC on the 18th — the other side of the same boundary
    expect(toDateString(new Date('2026-07-18T00:30:00.000Z'))).toBe('2026-07-18');
  });

  it('pads single-digit months and days', () => {
    expect(toDateString(new Date('2026-01-05T00:00:00.000Z'))).toBe('2026-01-05');
  });
});

describe('diffCalendarDays', () => {
  it('returns 0 for the same date', () => {
    expect(diffCalendarDays('2026-07-17', '2026-07-17')).toBe(0);
  });

  it('counts forward within a month', () => {
    expect(diffCalendarDays('2026-07-01', '2026-07-15')).toBe(14);
  });

  it('counts backward as a negative number', () => {
    expect(diffCalendarDays('2026-07-15', '2026-07-01')).toBe(-14);
  });

  it('counts across a month boundary', () => {
    expect(diffCalendarDays('2026-07-25', '2026-08-05')).toBe(11);
  });

  it('counts across a year boundary', () => {
    expect(diffCalendarDays('2025-12-28', '2026-01-03')).toBe(6);
  });

  it('counts correctly across Feb 29 in a leap year', () => {
    expect(diffCalendarDays('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('counts correctly across Feb in a non-leap year (no Feb 29 to skip)', () => {
    expect(diffCalendarDays('2025-02-28', '2025-03-01')).toBe(1);
  });
});

describe('addCalendarDays', () => {
  it('returns the same date for 0 days', () => {
    expect(addCalendarDays('2026-07-17', 0)).toBe('2026-07-17');
  });

  it('adds days within a month', () => {
    expect(addCalendarDays('2026-07-01', 14)).toBe('2026-07-15');
  });

  it('subtracts days with a negative input', () => {
    expect(addCalendarDays('2026-07-15', -14)).toBe('2026-07-01');
  });

  it('rolls over a month boundary', () => {
    expect(addCalendarDays('2026-07-25', 11)).toBe('2026-08-05');
  });

  it('rolls over a year boundary', () => {
    expect(addCalendarDays('2025-12-28', 6)).toBe('2026-01-03');
  });

  it('lands correctly on Feb 29 in a leap year', () => {
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('rolls Feb 28 -> Mar 1 in a non-leap year', () => {
    expect(addCalendarDays('2025-02-28', 1)).toBe('2025-03-01');
  });

  it('handles leap day one year forward landing on Feb 28 (2025 has no Feb 29)', () => {
    expect(addCalendarDays('2024-02-29', 365)).toBe('2025-02-28');
  });

  it('is unaffected by a US DST spring-forward date (2024-03-10)', () => {
    // Pure UTC-anchored day counting must not gain/lose a day around a
    // local DST transition — this only matters if the arithmetic were ever
    // reimplemented with local-time Date methods instead of Date.UTC.
    expect(addCalendarDays('2024-03-09', 1)).toBe('2024-03-10');
    expect(addCalendarDays('2024-03-10', 1)).toBe('2024-03-11');
    expect(diffCalendarDays('2024-03-09', '2024-03-11')).toBe(2);
  });

  it('is unaffected by a US DST fall-back date (2024-11-03)', () => {
    expect(addCalendarDays('2024-11-02', 1)).toBe('2024-11-03');
    expect(addCalendarDays('2024-11-03', 1)).toBe('2024-11-04');
    expect(diffCalendarDays('2024-11-02', '2024-11-04')).toBe(2);
  });
});