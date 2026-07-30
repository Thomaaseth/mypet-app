import { expect } from 'vitest';
import { z } from 'zod';

/**
 * Asserts a schema is `.strict()` and rejects an unrecognized key, for the RIGHT reason.
 * Starts from a known-valid payload so the ONLY possible failure cause is the injected
 * key, then asserts the failure is specifically an `unrecognized_keys` issue naming it.
 */
export function expectRejectsUnknownKey<T extends z.ZodTypeAny>(
  schema: T,
  validInput: z.input<T>,
  injectedKey = '__injected__',
): void {
  const payload: Record<string, unknown> = {
    ...(validInput as Record<string, unknown>),
    [injectedKey]: true,
  };
  const result = schema.safeParse(payload);
  expect(result.success).toBe(false);
  if (!result.success) {
    const rejectedForRightReason = result.error.issues.some(
      (issue) => issue.code === 'unrecognized_keys' && issue.keys.includes(injectedKey),
    );
    expect(rejectedForRightReason).toBe(true);
  }
}