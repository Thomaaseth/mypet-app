import { BadRequestError } from '@/middleware/errors';
import type { DryFoodEntry, WetFoodEntry } from '../../db/schema/food';
import { inclusiveDaySpan, lastDayOfSpan } from '@/shared/utils/dates';

// Tolerance threshold for feeding status (±5%)
const FEEDING_TOLERANCE_PERCENTAGE = 5;
const TOLERANCE_BUFFER = 0.5;
const WARNING_THRESHOLD = 7;

export class FoodCalculations {
    static calculateDryFoodRemaining(entry: DryFoodEntry, today: string): {
    remainingDays: number;
    depletionDate: string;
    remainingWeight: number;
  } {
    const totalWeightInGrams = parseFloat(entry.bagWeight);
    const dailyAmountInGrams = parseFloat(entry.dailyAmount);
    return this.remainingFrom(totalWeightInGrams, dailyAmountInGrams, entry.dateStarted, today);
  }

  static calculateWetFoodRemaining(entry: WetFoodEntry, today: string): {
    remainingDays: number;
    depletionDate: string;
    remainingWeight: number;
  } {
    const totalWeightInGrams = entry.numberOfUnits * parseFloat(entry.weightPerUnit);
    const dailyAmountInGrams = parseFloat(entry.dailyAmount);
    return this.remainingFrom(totalWeightInGrams, dailyAmountInGrams, entry.dateStarted, today);
  }

  // Shared remaining/depletion math for both food types.
  // `remainingWeight` and `remainingDays` are "as of today". `depletionDate` is a
  // FIXED property of the entry (start + total days of food) and does NOT depend on
  // `today`
  private static remainingFrom(
    totalWeightInGrams: number,
    dailyAmountInGrams: number,
    dateStarted: string,
    today: string
  ): { remainingDays: number; depletionDate: string; remainingWeight: number } {
    const daysElapsed = inclusiveDaySpan(dateStarted, today);
    const foodConsumedInGrams = Math.max(0, daysElapsed * dailyAmountInGrams);
    const remainingWeight = Math.max(0, totalWeightInGrams - foodConsumedInGrams);

    const remainingDays = dailyAmountInGrams > 0
      ? Math.floor(remainingWeight / dailyAmountInGrams + 1e-9)
      : 0;

    // ceil: the final short-ration day still counts as a day on which food exists.
    const totalDaysOfFood = dailyAmountInGrams > 0
      ? Math.ceil(totalWeightInGrams / dailyAmountInGrams)
      : 0;
    const depletionDate = lastDayOfSpan(dateStarted, totalDaysOfFood);

    return { remainingDays, depletionDate, remainingWeight };
  }


 // Calculate actual consumption metrics for finished food entries
  static calculateActualConsumption(
    entry: DryFoodEntry | WetFoodEntry
  ): {
    dateFinished: string;
    actualDaysElapsed: number;
    actualDailyConsumption: number;
    expectedDailyConsumption: number;
    variancePercentage: number;
    feedingStatus: 'overfeeding' | 'slightly-over' | 'normal' | 'slightly-under' | 'underfeeding';
  } {
    
    // Strict validation - dateFinished must exist for finished entries
    if (!entry.dateFinished) {
      throw new BadRequestError(
        `Cannot calculate consumption for finished entry ${entry.id}: dateFinished is missing`
      );
    }
    
    // Both start and end dates are INCLUSIVE (day 1 = dateStarted, last day = dateFinished)
    const actualDaysElapsed = inclusiveDaySpan(entry.dateStarted, entry.dateFinished);

    let totalWeightInGrams: number;

    if (entry.foodType === 'dry') {
      const dryEntry = entry as DryFoodEntry;
      totalWeightInGrams = parseFloat(dryEntry.bagWeight);
    } else {
      const wetEntry = entry as WetFoodEntry;
      totalWeightInGrams = wetEntry.numberOfUnits * parseFloat(wetEntry.weightPerUnit);
    }
    
    // Calculate actual daily consumption in grams
    const actualDailyConsumption = totalWeightInGrams / actualDaysElapsed;
    
    // Get expected daily consumption and convert to grams
    let expectedDailyInGrams = parseFloat(entry.dailyAmount);
    
    // Calculate variance percentage
    const variancePercentage = 
      ((actualDailyConsumption - expectedDailyInGrams) / expectedDailyInGrams) * 100;
    
    // Determine feeding status based on ±5% tolerance
    let feedingStatus: 'overfeeding' | 'slightly-over' | 'normal' | 'slightly-under' | 'underfeeding';
    
    if (variancePercentage >= WARNING_THRESHOLD + TOLERANCE_BUFFER) {  // > 7.5%
      feedingStatus = 'overfeeding';
    } else if (variancePercentage > FEEDING_TOLERANCE_PERCENTAGE + TOLERANCE_BUFFER) {  // > 5.5%
      feedingStatus = 'slightly-over';
    } else if (variancePercentage <= -(WARNING_THRESHOLD + TOLERANCE_BUFFER)) {  // < -7.5%
      feedingStatus = 'underfeeding';
    } else if (variancePercentage < -(FEEDING_TOLERANCE_PERCENTAGE + TOLERANCE_BUFFER)) {  // < -5.5%
      feedingStatus = 'slightly-under';
    } else {
      feedingStatus = 'normal';
    }
    
    return {
      dateFinished: entry.dateFinished,
      actualDaysElapsed,
      actualDailyConsumption,
      expectedDailyConsumption: expectedDailyInGrams,
      variancePercentage,
      feedingStatus
    };
  }
}