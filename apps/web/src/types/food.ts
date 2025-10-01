export type FoodType = 'dry' | 'wet';

// Separate, clean types
export type DryFoodEntry = {
  id: string;
  petId: string;
  foodType: 'dry';
  brandName: string | null;
  productName: string | null;
  bagWeight: string;
  bagWeightUnit: 'kg' | 'pounds';
  dailyAmount: string;
  dryDailyAmountUnit: 'grams' | 'cups';
  dateStarted: string;
  dateFinished: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Wet food fields (null for dry)
  numberOfUnits: null;
  weightPerUnit: null;
  wetWeightUnit: null;
  wetDailyAmountUnit: null;
  
  // Calculated fields for active entries
  remainingDays?: number;
  remainingWeight?: number;
  depletionDate?: string;  // String from API
  
  // Calculated fields for finished entries
  actualDaysElapsed?: number;
  actualDailyConsumption?: number;
  expectedDailyConsumption?: number;
  variancePercentage?: number;
  feedingStatus?: 'overfeeding' | 'normal' | 'underfeeding';
};

export type WetFoodEntry = {
  id: string;
  petId: string;
  foodType: 'wet';
  brandName: string | null;
  productName: string | null;
  numberOfUnits: number;
  weightPerUnit: string;
  wetWeightUnit: 'grams' | 'oz';
  dailyAmount: string;
  wetDailyAmountUnit: 'grams' | 'oz';
  dateStarted: string;
  dateFinished: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Dry food fields (null for wet)
  bagWeight: null;
  bagWeightUnit: null;
  dryDailyAmountUnit: null;
  
  // Calculated fields for active entries
  remainingDays?: number;
  remainingWeight?: number;
  depletionDate?: string;
  
  // Calculated fields for finished entries
  actualDaysElapsed?: number;
  actualDailyConsumption?: number;
  expectedDailyConsumption?: number;
  variancePercentage?: number;
  feedingStatus?: 'overfeeding' | 'normal' | 'underfeeding';
};

export type DryFoodFormData = {
  brandName?: string;
  productName?: string;
  bagWeight: string;
  bagWeightUnit: 'kg' | 'pounds';
  dailyAmount: string;
  dryDailyAmountUnit: 'grams' | 'cups';
  dateStarted: string;
};

export type WetFoodFormData = {
  brandName?: string;
  productName?: string;
  numberOfUnits: string; // String for form input
  weightPerUnit: string;
  wetWeightUnit: 'grams' | 'oz';
  dailyAmount: string;
  wetDailyAmountUnit: 'grams' | 'oz';
  dateStarted: string;
};

// API response types
export type DryFoodEntriesApiResponse = {
  foodEntries: DryFoodEntry[];
  total: number;
};

export type WetFoodEntriesApiResponse = {
  foodEntries: WetFoodEntry[];
  total: number;
};

export type AllFoodEntriesApiResponse = {
  foodEntries: (DryFoodEntry | WetFoodEntry)[];
  total: number;
};

// Unit labels
export const DRY_FOOD_BAG_UNITS = ['kg', 'pounds'] as const;
export const DRY_FOOD_DAILY_UNITS = ['grams', 'cups'] as const;
export const WET_FOOD_UNITS = ['grams', 'oz'] as const;