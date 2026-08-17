import type { DryFoodEntry, WetFoodEntry, FoodType } from '@/types/food';

// An active entry whose calculated fields are guaranteed present.
type CalculatedFoodEntry = (DryFoodEntry | WetFoodEntry) & {
  remainingDays: number;
  remainingWeight: number;
  depletionDate: string;
};

/**
 * Narrows an entry to one that carries its calculated fields. Active entries
 * carry these; entries that haven't been computed may not, so anything reading
 * `depletionDate` / `remainingDays` must go through this guard first.
 */
export function hasCalculatedFields(
  entry: DryFoodEntry | WetFoodEntry,
): entry is CalculatedFoodEntry {
  return (
    entry.remainingDays !== undefined &&
    entry.remainingWeight !== undefined &&
    entry.depletionDate !== undefined
  );
}

/**
 * Derives which food tab to show from the active entries.
 *
 * - none active            → 'dry'  (neutral default)
 * - single type active     → that type
 * - both types active      → the type of the entry with the soonest
 *                            `depletionDate` — the most urgent info wins.                           
 * - both active, but no
 *   entry has calc fields   → 'dry'  (same neutral default)
 *
 * Tie-break: on an equal `depletionDate`, the first entry encountered wins.
 * Callers pass entries dry-first (see FoodTrackerContext.activeFoodEntries),
 * so ties resolve to 'dry', preserving the prior default.
 */
export function resolveFoodTab(
  entries: (DryFoodEntry | WetFoodEntry)[],
): FoodType {
  const hasDry = entries.some((e) => e.foodType === 'dry');
  const hasWet = entries.some((e) => e.foodType === 'wet');

  // none / single type: nothing to arbitrate.
  if (!(hasDry && hasWet)) {
    return hasWet ? 'wet' : 'dry';
  }

  // both types active: pick the soonest-depleting entry's type.
  const datedEntries = entries.filter(hasCalculatedFields);
  if (datedEntries.length === 0) return 'dry';

  const soonest = datedEntries.reduce((earliest, entry) =>
    entry.depletionDate < earliest.depletionDate ? entry : earliest,
  );
  return soonest.foodType;
}