import type { AntiParasiteTreatmentFormData } from '@/shared/validations/anti-parasite-treatment';

// Service-call form data (what a route hands the service post-validation).
export function makeTreatmentData(
  overrides: Partial<AntiParasiteTreatmentFormData> = {},
): AntiParasiteTreatmentFormData {
  return {
    productName: 'Bravecto',
    categories: ['fleas_ticks'],
    durationUnit: 'months',
    durationAmount: 3,
    dateAdministered: '2024-01-15',
    ...overrides,
  };
}

// Invalid payloads for negative-path assertions (bypasses the FormData type
// so the service's own guards are what's under test).
export function makeInvalidTreatmentData(
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  return {
    productName: 'Bravecto',
    categories: ['fleas_ticks'],
    durationUnit: 'months',
    durationAmount: 3,
    dateAdministered: '2024-01-15',
    ...overrides,
  };
}