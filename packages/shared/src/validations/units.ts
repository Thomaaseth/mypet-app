import { z } from 'zod';

// Measurement system
// Metric: kg for weight/bags, grams for both dry and wet food.
// Imperial: lbs for weight/bags, grams for dry food daily amount
export const SUPPORTED_UNIT_SYSTEMS = ['metric', 'imperial'] as const;

export const unitSystemSchema = z.enum(SUPPORTED_UNIT_SYSTEMS, {
  errorMap: () => ({ message: 'Please select a valid unit system' }),
});

export type UnitSystem = z.infer<typeof unitSystemSchema>;

export interface SystemUnits {
  weightUnit: 'kg' | 'lbs';
  bagWeightUnit: 'kg' | 'lbs';
  wetFoodUnit: 'grams' | 'oz';
  dryDailyAmountUnit: 'grams'; // always grams regardless of system
}

export const unitSystemMap: Record<UnitSystem, SystemUnits> = {
  metric: {
    weightUnit: 'kg',
    bagWeightUnit: 'kg',
    wetFoodUnit: 'grams',
    dryDailyAmountUnit: 'grams',
  },
  imperial: {
    weightUnit: 'lbs',
    bagWeightUnit: 'lbs',
    wetFoodUnit: 'oz',
    dryDailyAmountUnit: 'grams',
  },
};

export function getUnitsForSystem(unitSystem: UnitSystem): SystemUnits {
  return unitSystemMap[unitSystem];
}