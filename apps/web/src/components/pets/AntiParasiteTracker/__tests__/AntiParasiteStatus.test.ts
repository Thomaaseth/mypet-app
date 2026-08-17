import { describe, it, expect } from 'vitest';
import {
  deriveCategoryCards,
  ANTI_PARASITE_EXPIRING_SOON_DAYS,
} from '../antiParasiteStatus';
import type { AntiParasiteTreatment } from '@/types/anti-parasite-treatments';
import type { AntiParasiteCategory } from '@/lib/validations/anti-parasite-treatment';

const ORDER: readonly AntiParasiteCategory[] = ['fleas_ticks', 'worms', 'heartworm'];
const FLEAS: AntiParasiteCategory = 'fleas_ticks';
const WORMS: AntiParasiteCategory = 'worms';
const HEART: AntiParasiteCategory = 'heartworm';
const TODAY = '2026-06-01';

const make = (
  o: Partial<AntiParasiteTreatment> &
    Pick<AntiParasiteTreatment, 'id' | 'categories' | 'expiryDate'>,
): AntiParasiteTreatment => ({
  petId: 'pet-1',
  productName: 'Filler',
  durationUnit: 'weeks',
  durationAmount: 4,
  dateAdministered: '2026-01-01',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...o,
});

describe('deriveCategoryCards — status & basics', () => {
  it('returns no cards when there are no treatments', () => {
    expect(deriveCategoryCards([], TODAY, ORDER)).toEqual([]);
  });

  it('single active treatment → one card, correct days + status', () => {
    const cards = deriveCategoryCards(
      [make({ id: 'a', categories: [FLEAS], expiryDate: '2026-07-01' })], // +30
      TODAY,
      ORDER,
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].categories).toEqual([FLEAS]);
    expect(cards[0].status).toBe('active');
    expect(cards[0].daysUntilExpiry).toBe(30);
    expect(cards[0].expiryDate).toBe('2026-07-01');
    expect(cards[0].governingTreatment.id).toBe('a');
  });

  it('ever-used: expired-only category still yields a card', () => {
    const cards = deriveCategoryCards(
      [make({ id: 'old', categories: [HEART], expiryDate: '2026-01-01' })],
      TODAY,
      ORDER,
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].categories).toEqual([HEART]);
    expect(cards[0].status).toBe('expired');
    expect(cards[0].daysUntilExpiry).toBeLessThan(0);
  });

  it('status boundaries: 0=soon, +7=soon, +8=active, -1=expired', () => {
    const at = (expiryDate: string) =>
      deriveCategoryCards([make({ id: 'x', categories: [FLEAS], expiryDate })], TODAY, ORDER)[0];
    expect(at('2026-06-01').status).toBe('expiring_soon');
    expect(at('2026-06-08').status).toBe('expiring_soon');
    expect(at('2026-06-09').status).toBe('active');
    expect(at('2026-05-31').status).toBe('expired');
  });
});

describe('deriveCategoryCards — furthest-expiry governance', () => {
  it('governs a category by furthest expiry across active + expired', () => {
    const cards = deriveCategoryCards(
      [
        make({ id: 'near', categories: [FLEAS], expiryDate: '2026-03-01' }),
        make({ id: 'far', categories: [FLEAS], expiryDate: '2026-09-01' }),
      ],
      TODAY,
      ORDER,
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].governingTreatment.id).toBe('far');
    expect(cards[0].expiryDate).toBe('2026-09-01');
  });
});

describe('deriveCategoryCards — MERGE by governing treatment', () => {
  // Case 1: one dose covering two categories → ONE merged card.
  it('merges categories sharing one governing treatment into a single card', () => {
    const cards = deriveCategoryCards(
      [make({ id: 'combo', categories: [FLEAS, WORMS], expiryDate: '2026-08-01' })],
      TODAY,
      ORDER,
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].governingTreatment.id).toBe('combo');
    expect(cards[0].categories).toEqual([FLEAS, WORMS]); // canonical order
  });

  // Case 3: one dose all three → one card, three categories.
  it('merges all three categories from one dose into one card', () => {
    const cards = deriveCategoryCards(
      [make({ id: 'all', categories: [HEART, FLEAS, WORMS], expiryDate: '2026-08-01' })],
      TODAY,
      ORDER,
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].categories).toEqual([FLEAS, WORMS, HEART]); // re-sorted canonical
  });

  // Case 2: two separate doses, different categories/expiries → two cards.
  it('keeps separate cards for categories governed by different treatments', () => {
    const cards = deriveCategoryCards(
      [
        make({ id: 'A', categories: [FLEAS], expiryDate: '2026-07-01' }),
        make({ id: 'B', categories: [WORMS], expiryDate: '2026-09-01' }),
      ],
      TODAY,
      ORDER,
    );
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.governingTreatment.id).sort()).toEqual(['A', 'B']);
  });

  // Case 5 (the killer): partial overlap. A={fleas,worms}@Jul, B={worms,heart}@Oct.
  // worms defects to B (furthest). Result: A governs only fleas; B governs worms+heart.
  it('resolves partial overlap: defected category leaves its old treatment card', () => {
    const cards = deriveCategoryCards(
      [
        make({ id: 'A', categories: [FLEAS, WORMS], expiryDate: '2026-07-01' }),
        make({ id: 'B', categories: [WORMS, HEART], expiryDate: '2026-10-01' }),
      ],
      TODAY,
      ORDER,
    );
    expect(cards).toHaveLength(2);
    const byId = Object.fromEntries(cards.map((c) => [c.governingTreatment.id, c]));
    expect(byId['A'].expiryDate).toBe('2026-07-01');
    expect(byId['B'].expiryDate).toBe('2026-10-01');
    expect(byId['B'].categories).toEqual([WORMS, HEART]);
  });

  // Defection where fleas leaves a 3-cat treatment for a later fleas-only one.
  // A={fleas}@Jan(far), B={fleas,worms,heart}@Dec. fleas→A, worms→B, heart→B.
  // B's `categories` stays its OWN tags (all three) — truthful to product.
  it('a treatment still tags its full category set even when one defected', () => {
    const cards = deriveCategoryCards(
      [
        make({ id: 'A', categories: [FLEAS], expiryDate: '2027-01-15' }),
        make({ id: 'B', categories: [FLEAS, WORMS, HEART], expiryDate: '2026-12-01' }),
      ],
      TODAY,
      ORDER,
    );
    expect(cards).toHaveLength(2);
    const byId = Object.fromEntries(cards.map((c) => [c.governingTreatment.id, c]));
    expect(byId['A'].categories).toEqual([FLEAS]);
    expect(byId['B'].categories).toEqual([FLEAS, WORMS, HEART]);
  });
});

describe('deriveCategoryCards — ordering (soonest expiry first)', () => {
  it('orders cards by soonest expiry first', () => {
    const cards = deriveCategoryCards(
      [
        make({ id: 'far', categories: [HEART], expiryDate: '2026-12-01' }),
        make({ id: 'soon', categories: [FLEAS], expiryDate: '2026-06-15' }),
        make({ id: 'mid', categories: [WORMS], expiryDate: '2026-09-01' }),
      ],
      TODAY,
      ORDER,
    );
    expect(cards.map((c) => c.governingTreatment.id)).toEqual(['soon', 'mid', 'far']);
  });

  it('breaks equal-expiry ties by canonical category order (deterministic)', () => {
    const cards = deriveCategoryCards(
      [
        make({ id: 'h', categories: [HEART], expiryDate: '2026-07-01' }),
        make({ id: 'f', categories: [FLEAS], expiryDate: '2026-07-01' }),
        make({ id: 'w', categories: [WORMS], expiryDate: '2026-07-01' }),
      ],
      TODAY,
      ORDER,
    );
    expect(cards.map((c) => c.categories[0])).toEqual([FLEAS, WORMS, HEART]);
  });
});

describe('deriveCategoryCards — threshold', () => {
  it('respects a custom threshold', () => {
    const t = [make({ id: 'x', categories: [FLEAS], expiryDate: '2026-06-11' })]; // +10
    expect(deriveCategoryCards(t, TODAY, ORDER, 14)[0].status).toBe('expiring_soon');
    expect(deriveCategoryCards(t, TODAY, ORDER)[0].status).toBe('active');
  });

  it('exposes the default threshold constant', () => {
    expect(ANTI_PARASITE_EXPIRING_SOON_DAYS).toBe(7);
  });
});
