import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the shared Redis client before importing the module under test.
const mockIncr = vi.fn();
const mockExpire = vi.fn();

vi.mock('../../redis', () => ({
  redisClient: {
    incr: (...args: unknown[]) => mockIncr(...args),
    expire: (...args: unknown[]) => mockExpire(...args),
  },
}));

// Import AFTER the mock is registered.
import { checkEmailQuota } from '../email.service';

describe('Email quota (per-recipient throttle)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows the first send and sets the expiry window', async () => {
    mockIncr.mockResolvedValue(1);
    const allowed = await checkEmailQuota('verification', 'user@example.com');
    expect(allowed).toBe(true);
    // First send in the window must set a TTL, else the key would live forever.
    expect(mockExpire).toHaveBeenCalledTimes(1);
  });

  it('allows sends up to the max (5)', async () => {
    mockIncr.mockResolvedValue(5);
    const allowed = await checkEmailQuota('verification', 'user@example.com');
    expect(allowed).toBe(true);
  });

  it('blocks the send once over the max', async () => {
    mockIncr.mockResolvedValue(6);
    const allowed = await checkEmailQuota('verification', 'user@example.com');
    expect(allowed).toBe(false);
  });

  it('only sets expiry on the first increment, not subsequent ones', async () => {
    mockIncr.mockResolvedValue(3);
    await checkEmailQuota('verification', 'user@example.com');
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it('normalizes recipient (case + whitespace) to one shared budget', async () => {
    mockIncr.mockResolvedValue(1);
    await checkEmailQuota('verification', '  User@Example.COM  ');
    // Key must be lowercased + trimmed so casing variants cannot each get a fresh budget.
    expect(mockIncr).toHaveBeenCalledWith('email-quota:verification:user@example.com');
  });

  it('keys different email types independently', async () => {
    mockIncr.mockResolvedValue(1);
    await checkEmailQuota('change-email', 'user@example.com');
    expect(mockIncr).toHaveBeenCalledWith('email-quota:change-email:user@example.com');
  });

  it('fails OPEN when Redis throws (allows the send)', async () => {
    mockIncr.mockRejectedValue(new Error('redis down'));
    const allowed = await checkEmailQuota('verification', 'user@example.com');
    expect(allowed).toBe(true);
  });
});