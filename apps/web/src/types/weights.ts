import type { WeightUnit } from './pet';

export interface WeightEntry {
  id: string;
  petId: string;
  weight: string; // always kg
  date: string; // ISO date string (YYYY-MM-DD format)
  createdAt: string;
  updatedAt: string;
}

// Form data types for weight entries
export interface WeightFormData {
  weight: string; // String for form input
  weightUnit: WeightUnit; // Sent in requests for server-side conversion
  date: string; // HTML date input format: YYYY-MM-DD
}

