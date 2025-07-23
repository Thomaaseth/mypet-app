export type FoodType = 'dry' | 'wet';
export type FoodUnit = 'grams' | 'pounds' | 'cups';

export interface FoodEntry {
  id: string;
  petId: string;
  foodType: FoodType;
  brandName: string | null;
  productName: string | null;
  bagWeight: string; // Decimal as string for consistency
  bagWeightUnit: FoodUnit;
  dailyAmount: string; // Decimal as string for consistency  
  dailyAmountUnit: FoodUnit;
  datePurchased: string; // ISO date string (YYYY-MM-DD format)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Calculated fields from backend
  remainingDays: number;
  remainingWeight: number;
  depletionDate: string; // ISO date string
}

export interface FoodFormData {
  foodType: FoodType;
  brandName?: string;
  productName?: string;
  bagWeight: string; // String for form input
  bagWeightUnit: FoodUnit;
  dailyAmount: string; // String for form input
  dailyAmountUnit: FoodUnit;
  datePurchased: string; // HTML date input format: YYYY-MM-DD
}

// API response types
export interface FoodEntriesApiResponse {
  foodEntries: FoodEntry[];
  total: number;
}

export interface FoodEntryApiResponse {
  foodEntry: FoodEntry;
}

// Error types
export interface FoodError {
  message: string;
  field?: keyof FoodFormData;
  code?: string;
}

// Helper for food type displays
export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  dry: 'Dry Food',
  wet: 'Wet Food', 
};

// Helper for unit displays
export const FOOD_UNIT_LABELS: Record<FoodUnit, string> = {
  grams: 'grams',
  pounds: 'lbs',
  cups: 'cups'
};