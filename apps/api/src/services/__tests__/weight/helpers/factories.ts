import { randomUUID } from 'crypto';
import type { WeightFormData } from '@/shared/validations/weight';
import type { NewWeightEntry } from '../../../../db/schema/weight-entries';


// service calls, includes weightUnit for server side conversion
export function makeWeightEntryData(
  overrides: Partial<WeightFormData> = {}
): WeightFormData {
  return {
    weight: '5.50',
    weightUnit: 'kg',
    date: '2024-01-15',
    ...overrides,
  };
}

// direct DB inserts, no weightUnit, canonical kg values only
export function makeWeightEntryDbValues(
  petId: string,
  overrides: Partial<Omit<NewWeightEntry, 'id' | 'petId' | 'createdAt' | 'updatedAt'>> = {}
): Omit<NewWeightEntry, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    petId,
    weight: '5.500',
    date: '2024-01-15',
    ...overrides,
  };
}

// mock WeightEntry object for unit tests
export function makeWeightEntry(overrides: Partial<{
  id: string;
  petId: string;
  weight: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: randomUUID(),
    petId: randomUUID(),
    weight: '5.500',
    date: '2024-01-15',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeInvalidWeightData(
  overrides: Record<string, unknown>
): Record<string, unknown> {
  return {
    weight: '5.50',
    weightUnit: 'kg',
    date: '2024-01-15',
    ...overrides,
  };  
}

// direct DB inserts of multiple entries
export function makeMultipleWeightEntries(
  petId: string,
  count: number = 2,
  baseOverrides: Partial<Omit<NewWeightEntry, 'id' | 'petId' | 'createdAt' | 'updatedAt'>> = {}
) {
  return Array.from({ length: count }, (_, index) => ({
    petId,
    weight: (5.50 + index * 0.25).toFixed(3), // '5.500', '5.750', etc.
    date: `2024-01-${String(15 + index).padStart(2, '0')}`,
    ...baseOverrides,
  }));
}