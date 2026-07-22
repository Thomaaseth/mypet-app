import { vi, beforeEach, afterEach } from 'vitest';

/**
 * Pins the system clock to a fixed UTC instant safely inside the
 * Pacific/Kiritimati (UTC+14) divergence window (UTC 10:00–23:59),
 * where Kiritimati's calendar date is guaranteed to be one day ahead
 * of server UTC's date. Use in tests that need to prove timezone-aware
 * "today" logic
 */
export function useFixedTimeForTimezoneTests() {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] }); // only freeze Date — NOT setTimeout/setInterval,
    vi.setSystemTime(new Date('2026-07-22T15:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
}