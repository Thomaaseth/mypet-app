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

export function formatConsumptionSummary(entry: DryFoodEntry | WetFoodEntry): string {
  if (!entry.actualDaysElapsed || !entry.feedingStatus) {
    return '';
  }

  const statusLabel = getFeedingStatusLabel(entry.feedingStatus);
  const icon = getFeedingStatusIcon(entry.feedingStatus);
  
  return `${icon} ${statusLabel} - ${entry.actualDaysElapsed} days`;
}
