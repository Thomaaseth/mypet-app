import { randomUUID } from 'crypto';
import type { DryFoodFormData, WetFoodFormData } from '../../../food';
import type { DryFoodEntry, WetFoodEntry } from '../../../../db/schema/food';

export function makeDryFoodData(
    overrides: Partial<DryFoodFormData> = {}
): DryFoodFormData {
  return {
    brandName: 'Test Brand',
    productName: 'Test Food',
    bagWeight: '4.4',
    bagWeightUnit: 'lbs',
    dailyAmount: '100',
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
      bagWeight: '4.4',
      bagWeightUnit: 'lbs',
      dailyAmount: '100',
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
    weightPerUnit: '3',
    wetFoodUnit: 'oz',
    dailyAmount: '6',
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
      weightPerUnit: '3',
      wetFoodUnit: 'oz',
      dailyAmount: '6',
      dateStarted: '2024-01-01',
      ...overrides,
    };
  }

// Raw db factories, no unit field, canonical grams
export function makeDryFoodEntry(
    overrides: Partial<DryFoodEntry> = {}
): DryFoodEntry {
  return {
    id: randomUUID(),
    petId: randomUUID(),
    foodType: 'dry',
    bagWeight: '2000.00',
    dailyAmount: '100.00',
    dateStarted: new Date().toISOString().split('T')[0],
    dateFinished: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    brandName: null,
    productName: null,
    numberOfUnits: null,
    weightPerUnit: null,
    ...overrides,
  };
}

// Raw db factories, no unit field, canonical grams
export function makeWetFoodEntry(
    overrides: Partial<WetFoodEntry> = {}
): WetFoodEntry {
  return {
    id: randomUUID(),
    petId: randomUUID(),
    foodType: 'wet',
    numberOfUnits: 12,
    weightPerUnit: '85.00',
    dailyAmount: '170.00',
    dateStarted: new Date().toISOString().split('T')[0],
    dateFinished: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    brandName: null,
    productName: null,
    bagWeight: null,
    ...overrides,
  };
}