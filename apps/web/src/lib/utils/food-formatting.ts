import type { DryFoodEntry, WetFoodEntry } from '@/types/food';
import { convertFoodWeight } from '@/shared/utils/units';
import type { TFunction } from 'i18next';
import { FEEDING_STATUS_KEYS } from '@/i18n/enum-keys';

type FeedingStatus = 'overfeeding' | 'slightly-over' | 'normal' | 'slightly-under' | 'underfeeding';

export function formatVariancePercentage(variance: number): string {
  const sign = variance > 0 ? '+' : '';
  return `${sign}${variance.toFixed(1)}%`;
}

export function getFeedingStatusColor(status: FeedingStatus): string {
  switch (status) {
    case 'overfeeding':
    case 'underfeeding':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'slightly-over':
    case 'slightly-under':
      return 'bg-accent/20 text-accent-foreground border-accent/30';
    case 'normal':
      return 'bg-secondary/10 text-secondary border-secondary/20';
    }
}

export function getFeedingStatusLabel(status: FeedingStatus, t: TFunction): string {
  return t(FEEDING_STATUS_KEYS[status]);
}



export function calculateExpectedDays(entry: DryFoodEntry | WetFoodEntry): number {
  if (entry.foodType === 'dry') {
    const dryEntry = entry as DryFoodEntry;
    const totalWeightGrams = parseFloat(dryEntry.bagWeight);
    const dailyAmountGrams = parseFloat(dryEntry.dailyAmount);
    return Math.ceil(totalWeightGrams / dailyAmountGrams);
  } else {
    const wetEntry = entry as WetFoodEntry;
    const totalWeightGrams = wetEntry.numberOfUnits * parseFloat(wetEntry.weightPerUnit);
    const dailyAmountGrams = parseFloat(wetEntry.dailyAmount);
    return Math.ceil(totalWeightGrams / dailyAmountGrams);
  }
}

export function formatFeedingStatusMessage(
  entry: DryFoodEntry | WetFoodEntry,
  dailyAmountUnit: 'grams' | 'oz',
  t: TFunction
): string {
  if (!entry.actualDaysElapsed || !entry.feedingStatus) {
    return '';
  }

  // const expectedDays = calculateExpectedDays(entry);
  // const daysDifference = Math.abs(entry.actualDaysElapsed - expectedDays);
  const statusLabel = getFeedingStatusLabel(entry.feedingStatus, t);

  if (entry.actualDailyConsumption) {
    // actualDailyConsumption is canonical grams — convert to the caller's display unit.
    const avgInDisplayUnit = convertFoodWeight(entry.actualDailyConsumption, 'grams', dailyAmountUnit);
    // const avg = dailyAmountUnit === 'oz' ? avgInDisplayUnit.toFixed(2) : avgInDisplayUnit.toFixed(1);
    const avg = formatRemainingWeight(avgInDisplayUnit);

    const shortUnit = dailyAmountUnit === 'grams' ? 'g' : dailyAmountUnit;
    return `${statusLabel} • ${avg}${shortUnit}${t('food.shared.perDaySuffix')}`;
  }
  return statusLabel;
}

/**
 * Builds the finish-date success toast message for dry/wet food entries.
 * Shared by useUpdateDryFoodFinishDate and useUpdateWetFoodFinishDate
 */
export function buildFinishDateToastMessage(entry: DryFoodEntry | WetFoodEntry, t: TFunction): string {
  const expectedDays = calculateExpectedDays(entry);
  const statusLabel = getFeedingStatusLabel(entry.feedingStatus!, t);

  return `${t('food.tracker.finishedToastPrefix', { count: entry.actualDaysElapsed })} ${t('food.tracker.expectedDaysParenthetical', { count: expectedDays })}. ${t('food.tracker.statusSuffix', { status: statusLabel })}`;
}

/**
 * Format weight with smart decimal precision
 * - < 0.1: 3 decimals (ex 0.009 kg)
 * - < 1: 2 decimals (ex 0.45 kg)
 * - >= 1: 1 decimal (ex 2.5 kg)
 */
export function formatRemainingWeight(weight: number): string {
  if (weight < 0.1) {
    return weight.toFixed(3).replace(/\.?0+$/, '');
  } else if (weight < 1) {
    return weight.toFixed(2).replace(/\.?0+$/, '');
  } else {
    return weight.toFixed(1).replace(/\.?0+$/, '');
  }
}

/**
 * Trim a decimal string to at most 1 decimal place
 * - "85.00" -> "85"
 * - "85.50" -> "85.5"
 * - "85.96" -> "86" (rounds)
 */
export function formatFoodQuantity(value: string): string {
  const num = parseFloat(value);
  return num.toFixed(1).replace(/\.?0+$/, '');
}