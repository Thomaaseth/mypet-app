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

// Future: food unit conversions (oz/grams, pounds)
// export const convertFoodWeight = (amount: number, fromUnit: FoodWeightUnit, toUnit: FoodWeightUnit): number => { ... }