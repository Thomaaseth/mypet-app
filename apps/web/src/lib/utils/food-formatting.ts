import type { DryFoodEntry, WetFoodEntry } from '@/types/food';

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

export function getFeedingStatusLabel(status: FeedingStatus): string {
  switch (status) {
    case 'overfeeding':
      return 'Overfeeding';
    case 'slightly-over':
      return 'Slightly over';
    case 'underfeeding':
      return 'Underfeeding';
    case 'slightly-under':
      return 'Slightly under';
    case 'normal':
      return 'Normal';
  }
}

export function calculateExpectedDays(entry: DryFoodEntry | WetFoodEntry): number {
  if (entry.foodType === 'dry') {
    const dryEntry = entry as DryFoodEntry;
    const totalWeightGrams = parseFloat(dryEntry.bagWeight) * (dryEntry.bagWeightUnit === 'kg' ? 1000 : 453.592);
    const dailyAmountGrams = parseFloat(dryEntry.dailyAmount);
    return Math.ceil(totalWeightGrams / dailyAmountGrams);
  } else {
    const wetEntry = entry as WetFoodEntry;
    const totalWeightGrams = wetEntry.numberOfUnits * parseFloat(wetEntry.weightPerUnit) * (wetEntry.wetWeightUnit === 'oz' ? 28.3495 : 1);
    const dailyAmountGrams = parseFloat(wetEntry.dailyAmount) * (wetEntry.wetDailyAmountUnit === 'oz' ? 28.3495 : 1);
    return Math.ceil(totalWeightGrams / dailyAmountGrams);
  }
}

export function formatFeedingStatusMessage(entry: DryFoodEntry | WetFoodEntry): string {
  if (!entry.actualDaysElapsed || !entry.feedingStatus) {
    return '';
  }

  // const expectedDays = calculateExpectedDays(entry);
  // const daysDifference = Math.abs(entry.actualDaysElapsed - expectedDays);
  const statusLabel = getFeedingStatusLabel(entry.feedingStatus);

  if (entry.actualDailyConsumption) {
    const unit = entry.foodType === 'dry'
      ? (entry as DryFoodEntry).dryDailyAmountUnit
      : (entry as WetFoodEntry).wetDailyAmountUnit;
    const avg = entry.foodType === 'wet' && (entry as WetFoodEntry).wetDailyAmountUnit === 'oz'
      ? (entry.actualDailyConsumption / 28.3495).toFixed(2)
      : entry.actualDailyConsumption.toFixed(1);
    
    const shortUnit = unit === 'grams' ? 'g' : unit; // 'oz' stays 'oz'
    return `${statusLabel} • ${avg}${shortUnit}/day`;
  }
  return statusLabel;
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