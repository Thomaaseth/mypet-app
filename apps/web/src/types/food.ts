export type FoodType = 'dry' | 'wet';
export type FoodUnit = 'kg' | 'pounds' | 'grams' | 'cups' | 'oz';

export interface FoodEntry {
  id: string;
  petId: string;
  foodType: FoodType;
  brandName: string | null;
  productName: string | null;
  bagWeight: string; // Decimal as string for consistency
  bagWeightUnit: FoodUnit;
  dailyAmount: string; // Decimal as string for consistency  
  dailyAmountUnit: 'grams' | 'cups' | 'oz';
  // For wet food only
  numberOfUnits?: number | null;
  weightPerUnit?: string | null;
  weightPerUnitUnit?: FoodUnit | null;
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
  dailyAmountUnit: 'grams' | 'cups' | 'oz';
  // For wet food only
  numberOfUnits?: string; // String for form input
  weightPerUnit?: string; // String for form input  
  weightPerUnitUnit?: FoodUnit;
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
  kg: 'kg',
  pounds: 'lbs',
  grams: 'grams',
  cups: 'cups', 
  oz: 'oz'
};

// Units allowed for different food types
export const DRY_FOOD_UNITS: FoodUnit[] = ['kg', 'pounds'];
export const DRY_FOOD_DAILY_UNITS: FoodUnit[] = ['grams', 'cups'];
export const WET_FOOD_UNITS: FoodUnit[] = ['grams', 'oz'];
export const WET_FOOD_DAILY_UNITS: FoodUnit[] = ['grams', 'oz'];