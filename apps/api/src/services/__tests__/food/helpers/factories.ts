import { randomUUID } from 'crypto';
import type { DryFoodFormData, WetFoodFormData } from '../../../food';

export function makeDryFoodData(
    overrides: Partial<DryFoodFormData> = {}
): DryFoodFormData {
  return {
    brandName: 'Test Brand',
    productName: 'Test Food',
    bagWeight: '2.0',
    bagWeightUnit: 'kg',
    dailyAmount: '100',
    dryDailyAmountUnit: 'grams',
    dateStarted: '2024-01-01',
    ...overrides,
  };
}

export function makeInvalidDryFoodData(
    overrides: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      brandName: 'Test Brand',
      productName: 'Test Food',
      bagWeight: '2.0',
      bagWeightUnit: 'kg',
      dailyAmount: '100',
      dryDailyAmountUnit: 'grams',
      dateStarted: '2024-01-01',
      ...overrides,
    };
  }

export function makeWetFoodData(
    overrides: Partial<WetFoodFormData> = {}
): WetFoodFormData {
  return {
    brandName: 'Wet Brand',
    productName: 'Wet Food',
    numberOfUnits: '12',
    weightPerUnit: '85',
    wetWeightUnit: 'grams',
    dailyAmount: '170',
    wetDailyAmountUnit: 'grams',
    dateStarted: '2024-01-01',
    ...overrides,
  };
}

export function makeInvalidWetFoodData(
    overrides: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      brandName: 'Test Brand',
      productName: 'Test Food', 
      numberOfUnits: '12',
      weightPerUnit: '85',
      wetWeightUnit: 'grams',
      dailyAmount: '170',
      wetDailyAmountUnit: 'grams',
      dateStarted: '2024-01-01',
      ...overrides,
    };
  }

export function makeDryFoodEntry(
    overrides: Partial<any> = {}
) {
  return {
    id: randomUUID(),
    petId: randomUUID(),
    foodType: 'dry' as const,
    bagWeight: '2.00',
    bagWeightUnit: 'kg' as const,
    dailyAmount: '100.00',
    dryDailyAmountUnit: 'grams' as const,
    dateStarted: new Date().toISOString().split('T')[0],
    dateFinished: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    brandName: null,
    productName: null,
    numberOfUnits: null,
    weightPerUnit: null,
    wetWeightUnit: null,
    wetDailyAmountUnit: null,
    ...overrides,
  };
}

export function makeWetFoodEntry(
    overrides: Partial<any> = {}
) {
  return {
    id: randomUUID(),
    petId: randomUUID(),
    foodType: 'wet' as const,
    numberOfUnits: 12,
    weightPerUnit: '85.00',
    wetWeightUnit: 'grams' as const,
    dailyAmount: '170.00',
    wetDailyAmountUnit: 'grams' as const,
    dateStarted: new Date().toISOString().split('T')[0],
    dateFinished: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    brandName: null,
    productName: null,
    bagWeight: null,
    bagWeightUnit: null,
    dryDailyAmountUnit: null,
    ...overrides,
  };
}