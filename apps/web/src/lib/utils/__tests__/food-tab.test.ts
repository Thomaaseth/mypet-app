import { describe, it, expect } from 'vitest';
import { resolveFoodTab, hasCalculatedFields } from '@/lib/utils/food-tab';
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';

// Minimal typed factories — only the fields the resolver reads matter; the rest
// are filled with valid defaults so the objects satisfy the entry types.
function makeDry(overrides: Partial<DryFoodEntry> = {}): DryFoodEntry {
  return {
    id: 'dry-1',
    petId: 'pet-1',
    foodType: 'dry',
    brandName: null,
    productName: null,
    bagWeight: '1000',
    dailyAmount: '50',
    dateStarted: '2026-01-01',
    dateFinished: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    numberOfUnits: null,
    weightPerUnit: null,
    remainingDays: 10,
    remainingWeight: 500,
    depletionDate: '2026-02-01',
    ...overrides,
  };
}

function makeWet(overrides: Partial<WetFoodEntry> = {}): WetFoodEntry {
  return {
    id: 'wet-1',
    petId: 'pet-1',
    foodType: 'wet',
    brandName: null,
    productName: null,
    numberOfUnits: 12,
    weightPerUnit: '85',
    dailyAmount: '170',
    dateStarted: '2026-01-01',
    dateFinished: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    bagWeight: null,
    remainingDays: 10,
    remainingWeight: 500,
    depletionDate: '2026-02-01',
    ...overrides,
  };
}

describe('hasCalculatedFields', () => {
  it('returns true when all calculated fields are present', () => {
    expect(hasCalculatedFields(makeDry())).toBe(true);
  });

  it('returns false when a calculated field is missing', () => {
    expect(
      hasCalculatedFields(makeDry({ depletionDate: undefined })),
    ).toBe(false);
  });
});

describe('resolveFoodTab', () => {
  it('defaults to dry when there are no active entries', () => {
    expect(resolveFoodTab([])).toBe('dry');
  });

  it('resolves to dry when only dry food is active', () => {
    expect(resolveFoodTab([makeDry()])).toBe('dry');
  });

  it('resolves to wet when only wet food is active', () => {
    expect(resolveFoodTab([makeWet()])).toBe('wet');
  });

  it('resolves to the type depleting soonest when both are active (dry sooner)', () => {
    const entries = [
      makeDry({ depletionDate: '2026-02-01' }),
      makeWet({ depletionDate: '2026-03-01' }),
    ];
    expect(resolveFoodTab(entries)).toBe('dry');
  });

  it('resolves to the type depleting soonest when both are active (wet sooner)', () => {
    const entries = [
      makeDry({ depletionDate: '2026-03-01' }),
      makeWet({ depletionDate: '2026-02-01' }),
    ];
    expect(resolveFoodTab(entries)).toBe('wet');
  });

  it('considers the single soonest entry across multiple per type', () => {
    const entries = [
      makeDry({ id: 'd1', depletionDate: '2026-05-01' }),
      makeDry({ id: 'd2', depletionDate: '2026-04-01' }),
      makeWet({ id: 'w1', depletionDate: '2026-03-15' }), // soonest overall
      makeWet({ id: 'w2', depletionDate: '2026-06-01' }),
    ];
    expect(resolveFoodTab(entries)).toBe('wet');
  });

  it('breaks depletionDate ties in favour of dry (caller passes entries dry-first)', () => {
    const entries = [
      makeDry({ depletionDate: '2026-02-01' }),
      makeWet({ depletionDate: '2026-02-01' }),
    ];
    expect(resolveFoodTab(entries)).toBe('dry');
  });

  it('ignores entries without calculated fields when picking the soonest', () => {
    const entries = [
      makeDry({ depletionDate: undefined }), // not comparable
      makeWet({ depletionDate: '2026-02-01' }),
    ];
    expect(resolveFoodTab(entries)).toBe('wet');
  });

  it('falls back to dry when both types are active but none have calculated fields', () => {
    const entries = [
      makeDry({ depletionDate: undefined, remainingDays: undefined, remainingWeight: undefined }),
      makeWet({ depletionDate: undefined, remainingDays: undefined, remainingWeight: undefined }),
    ];
    expect(resolveFoodTab(entries)).toBe('dry');
  });
});
