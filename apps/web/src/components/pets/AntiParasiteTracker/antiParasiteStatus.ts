import type { AntiParasiteCategory } from '@/lib/validations/anti-parasite-treatment';
import type { AntiParasiteTreatment } from '@/types/anti-parasite-treatments';

export const ANTI_PARASITE_EXPIRING_SOON_DAYS = 7;

export type AntiParasiteStatus = 'active' | 'expiring_soon' | 'expired';

// One card per governing treatment. A "governing treatment" for a category is
// the furthest-expiry treatment tagging it; cards that share the same governing
// treatment are merged into one (a single dose covering several categories = one
// card). `categories` is the governing treatment's own category set (drives the
// label + tags). Status/countdown come from that one treatment's expiry.
export interface AntiParasiteCategoryCard {
  governingTreatment: AntiParasiteTreatment;
  categories: AntiParasiteCategory[]; // = governingTreatment.categories, in canonical order
  expiryDate: string;
  status: AntiParasiteStatus;
  daysUntilExpiry: number;
}

function diffInDays(fromYmd: string, toYmd: string): number {
  const from = Date.parse(`${fromYmd}T00:00:00Z`);
  const to = Date.parse(`${toYmd}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

function deriveStatus(daysUntilExpiry: number, threshold: number): AntiParasiteStatus {
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= threshold) return 'expiring_soon';
  return 'active';
}

export function deriveCategoryCards(
  treatments: AntiParasiteTreatment[],
  today: string,
  categoryOrder: readonly AntiParasiteCategory[],
  threshold: number = ANTI_PARASITE_EXPIRING_SOON_DAYS,
): AntiParasiteCategoryCard[] {
  // 1. Per category, find its governing (furthest-expiry) treatment.
  const governing = new Map<AntiParasiteCategory, AntiParasiteTreatment>();
  for (const treatment of treatments) {
    for (const category of treatment.categories) {
      const current = governing.get(category);
      if (current === undefined || treatment.expiryDate > current.expiryDate) {
        governing.set(category, treatment);
      }
    }
  }

  // 2. Group by the governing treatment each category resolved to (merge).
  const byTreatment = new Map<string, AntiParasiteTreatment>();
  for (const treatment of governing.values()) {
    byTreatment.set(treatment.id, treatment);
  }

  const orderIndex = new Map(categoryOrder.map((category, index) => [category, index]));
  const sortByOrder = (a: AntiParasiteCategory, b: AntiParasiteCategory) =>
    (orderIndex.get(a) ?? 0) - (orderIndex.get(b) ?? 0);

  // 3. One card per governing treatment. Label/tags use the treatment's own
  //    categories (canonical order); status/countdown from its expiry.
  return Array.from(byTreatment.values(), (governingTreatment) => {
    const daysUntilExpiry = diffInDays(today, governingTreatment.expiryDate);
    return {
      governingTreatment,
      categories: [...governingTreatment.categories].sort(sortByOrder),
      expiryDate: governingTreatment.expiryDate,
      status: deriveStatus(daysUntilExpiry, threshold),
      daysUntilExpiry,
    };
  }).sort((a, b) => {
    // Soonest expiry first (most urgent leads). Tie-break on the card's earliest
    // category (canonical order) so equal-expiry cards have a stable, deterministic
    // order rather than depending on Map iteration order.
    if (a.expiryDate !== b.expiryDate) {
      return a.expiryDate < b.expiryDate ? -1 : 1;
    }
    return (orderIndex.get(a.categories[0]) ?? 0) - (orderIndex.get(b.categories[0]) ?? 0);
  });
}