import type { WeightUnit } from './pet';

export interface WeightEntry {
  id: string;
  petId: string;
  weight: string; // Decimal as string (consistent with Pet weight field)
  date: string; // ISO date string (YYYY-MM-DD format)
  createdAt: string;
  updatedAt: string;
}

// Form data types for weight entries
export interface WeightFormData {
  weight: string; // String for form input
  date: string; // HTML date input format: YYYY-MM-DD
}

// API response types
export interface WeightEntriesApiResponse {
  weightEntries: WeightEntry[];
  total: number;
  weightUnit: WeightUnit; // The unit used for this pet
}

export interface WeightEntryApiResponse {
  weightEntry: WeightEntry;
}

// Error types
export interface WeightError {
  message: string;
  field?: keyof WeightFormData;
  code?: string;
}

// Chart data interface for display
export interface WeightChartData {
  date: string; // For display: "Jan 15, 2024"
  weight: number; // Parsed number for chart
  originalDate: string; // Original ISO date for sorting
}