import { BadRequestError } from '@/middleware/errors';
import type { DryFoodEntry, WetFoodEntry } from '../../db/schema/food';
import { diffCalendarDays, addCalendarDays } from '@/shared/utils/dates';


// Tolerance threshold for feeding status (±5%)
const FEEDING_TOLERANCE_PERCENTAGE = 5;
const TOLERANCE_BUFFER = 0.5;
const WARNING_THRESHOLD = 7;

// Unit conversion constants
const GRAMS_PER_KG = 1000;
const GRAMS_PER_LB = 453.592;
const GRAMS_PER_OZ = 28.3495;

export class FoodCalculations {
  static calculateDryFoodRemaining(entry: DryFoodEntry, today: string): { 
    remainingDays: number; 
    depletionDate: string; 
    remainingWeight: number;
  } {
    // Day 1 logic: dateStarted = first day of consumption
    const daysElapsed = diffCalendarDays(entry.dateStarted, today) + 1;
    
    // Convert bag weight to grams for calculation
    let bagWeightInGrams = parseFloat(entry.bagWeight);
    if (entry.bagWeightUnit === 'kg') {
      bagWeightInGrams *= GRAMS_PER_KG;
    } else if (entry.bagWeightUnit === 'pounds') {
      bagWeightInGrams *= GRAMS_PER_LB;
    }
    
    const dailyAmountInGrams = parseFloat(entry.dailyAmount);
    
    const foodConsumedInGrams = Math.max(0, daysElapsed * dailyAmountInGrams);
    const remainingWeightInGrams = Math.max(0, bagWeightInGrams - foodConsumedInGrams);
    
    // Convert back to original bag weight unit for display
    let remainingWeight = remainingWeightInGrams;
    if (entry.bagWeightUnit === 'kg') {
      remainingWeight = remainingWeightInGrams / GRAMS_PER_KG;
    } else if (entry.bagWeightUnit === 'pounds') {
      remainingWeight = remainingWeightInGrams / GRAMS_PER_LB;
    }
    
    const remainingDays = dailyAmountInGrams > 0 
      ? Math.floor(remainingWeightInGrams / dailyAmountInGrams) 
      : 0;    

    // Calculate depletion date
    let depletionDate: string;
    if (remainingDays > 0) {
      depletionDate = addCalendarDays(today, remainingDays);
    } else {
      const totalConsumptionDays = dailyAmountInGrams > 0 
        ? Math.ceil(bagWeightInGrams / dailyAmountInGrams) 
        : 0;
      depletionDate = addCalendarDays(entry.dateStarted, totalConsumptionDays);
    }

    return { remainingDays, depletionDate, remainingWeight };
  }

  static calculateWetFoodRemaining(entry: WetFoodEntry, today: string): { 
    remainingDays: number; 
    depletionDate: string; 
    remainingWeight: number;
  } {
    
    // Day 1 logic: dateStarted counts as first day of consumption
    const daysElapsed = diffCalendarDays(entry.dateStarted, today) + 1;


    // Convert total weight to grams for calculation
    let totalWeightInGrams = entry.numberOfUnits * parseFloat(entry.weightPerUnit);
    if (entry.wetWeightUnit === 'oz') {
      totalWeightInGrams *= GRAMS_PER_OZ;
    }

    // Convert daily amount to grams for calculation
    let dailyAmountInGrams = parseFloat(entry.dailyAmount);
    if (entry.wetDailyAmountUnit === 'oz') {
      dailyAmountInGrams *= GRAMS_PER_OZ;
    }
    
    const foodConsumedInGrams = Math.max(0, daysElapsed * dailyAmountInGrams);
    const remainingWeightInGrams = Math.max(0, totalWeightInGrams - foodConsumedInGrams);
    
    // Convert back to original weight unit for display
    let remainingWeight = remainingWeightInGrams;
    if (entry.wetWeightUnit === 'oz') {
      remainingWeight = remainingWeightInGrams / GRAMS_PER_OZ;
    }
    
    const remainingDays = dailyAmountInGrams > 0 
    ? Math.floor(remainingWeightInGrams / dailyAmountInGrams) 
    : 0;

    // Calculate depletion date
    let depletionDate: string;
    if (remainingDays > 0) {
      depletionDate = addCalendarDays(today, remainingDays);
    } else {
      const totalConsumptionDays = dailyAmountInGrams > 0 
        ? Math.ceil(totalWeightInGrams / dailyAmountInGrams) 
        : 0;
      depletionDate = addCalendarDays(entry.dateStarted, totalConsumptionDays);
    }

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
    const actualDaysElapsed = diffCalendarDays(entry.dateStarted, entry.dateFinished) + 1;

    // Calculate total weight in grams based on food type
    let totalWeightInGrams: number;
    
    if (entry.foodType === 'dry') {
      const dryEntry = entry as DryFoodEntry;
      totalWeightInGrams = parseFloat(dryEntry.bagWeight);
      
      if (dryEntry.bagWeightUnit === 'kg') {
        totalWeightInGrams *= GRAMS_PER_KG;
      } else if (dryEntry.bagWeightUnit === 'pounds') {
        totalWeightInGrams *= GRAMS_PER_LB;
      }
    } else {
      const wetEntry = entry as WetFoodEntry;
      totalWeightInGrams = wetEntry.numberOfUnits * parseFloat(wetEntry.weightPerUnit);
      
      if (wetEntry.wetWeightUnit === 'oz') {
        totalWeightInGrams *= GRAMS_PER_OZ;
      }
    }
    
    // Calculate actual daily consumption in grams
    const actualDailyConsumption = totalWeightInGrams / actualDaysElapsed;
    
    // Get expected daily consumption and convert to grams
    let expectedDailyInGrams = parseFloat(entry.dailyAmount);
    
    // Only wet food needs conversion from oz to grams
    if (entry.foodType === 'wet') {
      const wetEntry = entry as WetFoodEntry;
      if (wetEntry.wetDailyAmountUnit === 'oz') {
        expectedDailyInGrams *= GRAMS_PER_OZ;
      }
    }
    
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