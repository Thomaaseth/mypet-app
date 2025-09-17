// import { randomUUID } from 'crypto';
// import type { WeightEntryFormData } from '../../../../db/schema/weight-entries';

// export function makeWeightEntryData(
//   overrides: Partial<WeightEntryFormData> = {}
// ): WeightEntryFormData {
//   return {
//     weight: '5.50',
//     date: '2024-01-15',
//     ...overrides,
//   };
// }

// export function makeWeightEntry(overrides: Partial<any> = {}) {
//   return {
//     id: randomUUID(),
//     petId: randomUUID(),
//     weight: '5.50',
//     date: '2024-01-15',
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     ...overrides,
//   };
// }

// export function makeInvalidWeightData(
//   overrides: Record<string, unknown>
// ): Record<string, unknown> {
//   return {
//     weight: '5.50',
//     date: '2024-01-15',
//     ...overrides,
//   };
// }

// export function makeMultipleWeightEntries(
//   petId: string,
//   count: number = 2,
//   baseOverrides: Partial<any> = {}
// ) {
//   return Array.from({ length: count }, (_, index) => ({
//     petId,
//     weight: `${5.50 + (index * 0.25)}`, // 5.50, 5.75, 6.00, etc.
//     date: `2024-01-${15 + index}`, // Sequential dates
//     ...baseOverrides,
//   }));
// }