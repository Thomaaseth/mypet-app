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

// Future: food unit conversions (oz/grams, pounds)
// export const convertFoodWeight = (amount: number, fromUnit: FoodWeightUnit, toUnit: FoodWeightUnit): number => { ... }