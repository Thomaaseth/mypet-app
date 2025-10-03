import type { DryFoodEntry, WetFoodEntry } from '@/types/food';

type FeedingStatus = 'overfeeding' | 'normal' | 'underfeeding';

export function formatVariancePercentage(variance: number): string {
  const sign = variance > 0 ? '+' : '';
  return `${sign}${variance.toFixed(1)}%`;
}

export function getFeedingStatusColor(status: FeedingStatus): string {
  switch (status) {
    case 'overfeeding':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'underfeeding':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'normal':
      return 'bg-green-100 text-green-800 border-green-200';
  }
}

export function getFeedingStatusLabel(status: FeedingStatus): string {
  switch (status) {
    case 'overfeeding':
      return 'Overfeeding';
    case 'underfeeding':
      return 'Underfeeding';
    case 'normal':
      return 'Normal';
  }
}

export function getFeedingStatusIcon(status: FeedingStatus): string {
  switch (status) {
    case 'overfeeding':
      return '🔴';
    case 'underfeeding':
      return '🟡';
    case 'normal':
      return '🟢';
  }
}

// export function formatConsumptionSummary(entry: DryFoodEntry | WetFoodEntry): string {
//   if (!entry.actualDaysElapsed || !entry.feedingStatus) {
//     return '';
//   }

//   const statusLabel = getFeedingStatusLabel(entry.feedingStatus);
//   const icon = getFeedingStatusIcon(entry.feedingStatus);
  
//   return `${icon} ${statusLabel} - ${entry.actualDaysElapsed} days`;
// }

export function calculateExpectedDays(entry: DryFoodEntry | WetFoodEntry): number {
  if (entry.foodType === 'dry') {
    const dryEntry = entry as DryFoodEntry;
    const totalWeightGrams = parseFloat(dryEntry.bagWeight) * (dryEntry.bagWeightUnit === 'kg' ? 1000 : 453.592);
    const dailyAmountGrams = parseFloat(dryEntry.dailyAmount) * (dryEntry.dryDailyAmountUnit === 'cups' ? 120 : 1);
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

  const expectedDays = calculateExpectedDays(entry);
  const daysDifference = Math.abs(entry.actualDaysElapsed - expectedDays);
  const statusLabel = getFeedingStatusLabel(entry.feedingStatus);
  const icon = getFeedingStatusIcon(entry.feedingStatus);

  if (entry.feedingStatus === 'overfeeding') {
    return `${icon} ${statusLabel} by ~${daysDifference} day${daysDifference !== 1 ? 's' : ''}`;
  } else if (entry.feedingStatus === 'underfeeding') {
    return `${icon} ${statusLabel} by ${daysDifference} day${daysDifference !== 1 ? 's' : ''}`;
  } else {
    return `${icon} ${statusLabel}`;
  }
}
