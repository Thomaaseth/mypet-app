import type { WeightUnit } from './pet';

export interface WeightTarget {
  id: string;
  petId: string;
  minWeight: string; // Decimal as string (consistent with weight entries)
  maxWeight: string; // Decimal as string
  weightUnit: WeightUnit;
  createdAt: string;
  updatedAt: string;
}

// Form data types for weight target
export interface WeightTargetFormData {
  minWeight: string; // String for form input
  maxWeight: string; // String for form input
  weightUnit: WeightUnit;
}

// API response types
export interface WeightTargetApiResponse {
  weightTarget: WeightTarget | null; // null when no target exists
}

// Error types
export interface WeightTargetError {
  message: string;
  field?: keyof WeightTargetFormData;
  code?: string;
}