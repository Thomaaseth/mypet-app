import type { DryFoodEntry, WetFoodEntry } from '../../db/schema/food';

export class FoodCalculations {
  static calculateDryFoodRemaining(entry: DryFoodEntry): { remainingDays: number; depletionDate: Date; remainingWeight: number } {
    const today = new Date();
    const purchaseDate = new Date(entry.dateStarted);
    
    const daysSincePurchase = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Convert bag weight to grams for calculation
    let bagWeightInGrams = parseFloat(entry.bagWeight);
    if (entry.bagWeightUnit === 'kg') {
      bagWeightInGrams = bagWeightInGrams * 1000;
    } else if (entry.bagWeightUnit === 'pounds') {
      bagWeightInGrams = bagWeightInGrams * 453.592;
    }
    
    // Convert daily amount to grams for calculation
    let dailyAmountInGrams = parseFloat(entry.dailyAmount);
    if (entry.dryDailyAmountUnit === 'cups') {
      dailyAmountInGrams = dailyAmountInGrams * 120; // 1 cup ≈ 120g
    }
    
    const foodConsumedInGrams = Math.max(0, daysSincePurchase * dailyAmountInGrams);
    const remainingWeightInGrams = Math.max(0, bagWeightInGrams - foodConsumedInGrams);
    
    // Convert back to original bag weight unit for display
    let remainingWeight = remainingWeightInGrams;
    if (entry.bagWeightUnit === 'kg') {
      remainingWeight = remainingWeightInGrams / 1000;
    } else if (entry.bagWeightUnit === 'pounds') {
      remainingWeight = remainingWeightInGrams / 453.592;
    }
    
    const remainingDays = dailyAmountInGrams > 0 ? Math.floor(remainingWeightInGrams / dailyAmountInGrams) : 0;
    
    // Calculate depletion date for both active and finished items
    let depletionDate: Date;
    if (remainingDays > 0) {
      // Active item: today + remaining days
      depletionDate = new Date();
      depletionDate.setDate(depletionDate.getDate() + remainingDays);
    } else {
      // Finished item: purchase date + total consumption days
      const totalConsumptionDays = dailyAmountInGrams > 0 ? Math.ceil(bagWeightInGrams / dailyAmountInGrams) : 0;
      depletionDate = new Date(purchaseDate);
      depletionDate.setDate(depletionDate.getDate() + totalConsumptionDays);
    }
    
    return { remainingDays, depletionDate, remainingWeight };
  }

  static calculateWetFoodRemaining(entry: WetFoodEntry): { remainingDays: number; depletionDate: Date; remainingWeight: number } {
    const today = new Date();
    const purchaseDate = new Date(entry.dateStarted);
    
    const daysSincePurchase = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Convert total weight to grams for calculation
    let totalWeightInGrams = entry.numberOfUnits * parseFloat(entry.weightPerUnit);
    if (entry.wetWeightUnit === 'oz') {
      totalWeightInGrams = totalWeightInGrams * 28.3495; // oz to grams
    }
    
    // Convert daily amount to grams for calculation
    let dailyAmountInGrams = parseFloat(entry.dailyAmount);

    if (entry.wetDailyAmountUnit === 'oz') {
      dailyAmountInGrams = dailyAmountInGrams * 28.3495; // oz to grams
    }
    
    const foodConsumedInGrams = Math.max(0, daysSincePurchase * dailyAmountInGrams);
    const remainingWeightInGrams = Math.max(0, totalWeightInGrams - foodConsumedInGrams);
    
    // Convert back to original weight unit for display
    let remainingWeight = remainingWeightInGrams;
    if (entry.wetWeightUnit === 'oz') {
      remainingWeight = remainingWeightInGrams / 28.3495; // grams to oz
    }
    
    const remainingDays = dailyAmountInGrams > 0 ? Math.floor(remainingWeightInGrams / dailyAmountInGrams) : 0;
    
    // Calculate depletion date correctly for both active and finished items
    let depletionDate: Date;
    if (remainingDays > 0) {
      // Active item: today + remaining days
      depletionDate = new Date();
      depletionDate.setDate(depletionDate.getDate() + remainingDays);
    } else {
      // Finished item: purchase date + total consumption days
      const totalConsumptionDays = dailyAmountInGrams > 0 ? Math.ceil(totalWeightInGrams / dailyAmountInGrams) : 0;
      depletionDate = new Date(purchaseDate);
      depletionDate.setDate(depletionDate.getDate() + totalConsumptionDays);
    }
    
    return { remainingDays, depletionDate, remainingWeight };
  }
}