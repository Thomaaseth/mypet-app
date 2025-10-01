import { BadRequestError } from '@/middleware/errors';
import type { DryFoodEntry, WetFoodEntry } from '../../db/schema/food';

// Tolerance threshold for feeding status (±15%)
const FEEDING_TOLERANCE_PERCENTAGE = 15;

// Unit conversion constants
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const GRAMS_PER_KG = 1000;
const GRAMS_PER_LB = 453.592;
const GRAMS_PER_OZ = 28.3495;
const GRAMS_PER_CUP = 120; // Approximate for dry dog/cat food

export class FoodCalculations {
  static calculateDryFoodRemaining(entry: DryFoodEntry): { 
    remainingDays: number; 
    depletionDate: Date; 
    remainingWeight: number 
  } {
    const today = new Date();
    const startDate = new Date(entry.dateStarted);
    
    // Day 1 logic: dateStarted = first day of consumption
    const daysElapsed = Math.max(1, Math.floor(
      (today.getTime() - startDate.getTime()) / MS_PER_DAY
    ));
    
    // Convert bag weight to grams for calculation
    let bagWeightInGrams = parseFloat(entry.bagWeight);
    if (entry.bagWeightUnit === 'kg') {
      bagWeightInGrams *= GRAMS_PER_KG;
    } else if (entry.bagWeightUnit === 'pounds') {
      bagWeightInGrams *= GRAMS_PER_LB;
    }
    
    // Convert daily amount to grams for calculation
    let dailyAmountInGrams = parseFloat(entry.dailyAmount);
    if (entry.dryDailyAmountUnit === 'cups') {
      dailyAmountInGrams *= GRAMS_PER_CUP;
    }
    
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
    let depletionDate: Date;
    if (remainingDays > 0) {
      // Active item: today + remaining days
      depletionDate = new Date();
      depletionDate.setDate(depletionDate.getDate() + remainingDays);
    } else {
      // Finished item: start date + total consumption days
      const totalConsumptionDays = dailyAmountInGrams > 0 
        ? Math.ceil(bagWeightInGrams / dailyAmountInGrams) 
        : 0;
      depletionDate = new Date(startDate);
      depletionDate.setDate(depletionDate.getDate() + totalConsumptionDays);
    }
  
    return { remainingDays, depletionDate, remainingWeight };
  }

  static calculateWetFoodRemaining(entry: WetFoodEntry): { 
    remainingDays: number; 
    depletionDate: Date; 
    remainingWeight: number 
  } {
    const today = new Date();
    const startDate = new Date(entry.dateStarted);
    
    // Day 1 logic: dateStarted counts as first day of consumption
    const daysElapsed = Math.max(1, Math.floor(
      (today.getTime() - startDate.getTime()) / MS_PER_DAY
    ));   

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
    let depletionDate: Date;
    if (remainingDays > 0) {
      // Active item: today + remaining days
      depletionDate = new Date();
      depletionDate.setDate(depletionDate.getDate() + remainingDays);
    } else {
      // Finished item: start date + total consumption days
      const totalConsumptionDays = dailyAmountInGrams > 0 
        ? Math.ceil(totalWeightInGrams / dailyAmountInGrams) 
        : 0;
      depletionDate = new Date(startDate);
      depletionDate.setDate(depletionDate.getDate() + totalConsumptionDays);
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
    feedingStatus: 'overfeeding' | 'normal' | 'underfeeding';
  } {
    
    // Strict validation - dateFinished must exist for finished entries
    if (!entry.dateFinished) {
      throw new BadRequestError(
        `Cannot calculate consumption for finished entry ${entry.id}: dateFinished is missing`
      );
    }
    
    const finishDate = new Date(entry.dateFinished);
    const startDate = new Date(entry.dateStarted);
    
    // Calculate actual days elapsed (minimum 1 day)
    const actualDaysElapsed = Math.max(1, Math.floor(
      (finishDate.getTime() - startDate.getTime()) / MS_PER_DAY
    ));
    
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
    
    if (entry.foodType === 'dry') {
      const dryEntry = entry as DryFoodEntry;
      if (dryEntry.dryDailyAmountUnit === 'cups') {
        expectedDailyInGrams *= GRAMS_PER_CUP;
      }
    } else {
      const wetEntry = entry as WetFoodEntry;
      if (wetEntry.wetDailyAmountUnit === 'oz') {
        expectedDailyInGrams *= GRAMS_PER_OZ;
      }
    }
    
    // Calculate variance percentage
    const variancePercentage = 
      ((actualDailyConsumption - expectedDailyInGrams) / expectedDailyInGrams) * 100;
    
    // Determine feeding status based on ±15% tolerance
    let feedingStatus: 'overfeeding' | 'normal' | 'underfeeding';
    
    if (variancePercentage > FEEDING_TOLERANCE_PERCENTAGE) {
      feedingStatus = 'overfeeding';
    } else if (variancePercentage < -FEEDING_TOLERANCE_PERCENTAGE) {
      feedingStatus = 'underfeeding';
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