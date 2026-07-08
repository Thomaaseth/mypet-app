import type { WeightUnit } from '../validations/pet';

// Pet body weight conversion (kg/lbs)
export const convertWeight = (weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  if (fromUnit === toUnit) return weight;

  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return weight * 2.20462;
  } else if (fromUnit === 'lbs' && toUnit === 'kg') {
    return weight / 2.20462;
  }

  return weight;
};

/**
 * Formats a numeric weight value removing trailing zeros.
 * formatWeight(4.80) → '4.8'
 * formatWeight(43.00) → '43'
 * formatWeight(4.85) → '4.85'
 */
export const formatWeight = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals).replace(/\.?0+$/, '');
};

// Food weight conversion (kg/lbs for dry food bags, grams/oz for wet food + dry daily amount)
// Converts through grams as a common anchor
export type FoodWeightUnit = 'kg' | 'lbs' | 'grams' | 'oz';

const GRAMS_PER_UNIT: Record<FoodWeightUnit, number> = {
  grams: 1,
  kg: 1000,
  lbs: 453.592,
  oz: 28.3495,
};

export const convertFoodWeight = (
  amount: number,
  fromUnit: FoodWeightUnit,
  toUnit: FoodWeightUnit
): number => {
  if (fromUnit === toUnit) return amount;

  const amountInGrams = amount * GRAMS_PER_UNIT[fromUnit];
  return amountInGrams / GRAMS_PER_UNIT[toUnit];
};