import type { WeightUnit } from './pet';

export interface WeightTarget {
  id: string;
  petId: string;
  minWeight: string; // always kg
  maxWeight: string; // always kg
  createdAt: string;
  updatedAt: string;
}

// Form data types for weight target
export interface WeightTargetFormData {
  minWeight: string;
  maxWeight: string;
  weightUnit: WeightUnit; // Still sent in requests for server-side conversion
}

// Error types
export interface WeightTargetError {
  message: string;
  field?: keyof WeightTargetFormData;
  code?: string;
}