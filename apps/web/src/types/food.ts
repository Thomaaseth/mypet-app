// apps/web/src/types/food.ts
export type FoodType = 'dry' | 'wet';

// Separate, clean types - no union hell
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
  datePurchased: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Calculated fields
  remainingDays: number;
  remainingWeight: number;
  depletionDate: string;
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
  datePurchased: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Calculated fields
  remainingDays: number;
  remainingWeight: number;
  depletionDate: string;
};

export type DryFoodFormData = {
  brandName?: string;
  productName?: string;
  bagWeight: string;
  bagWeightUnit: 'kg' | 'pounds';
  dailyAmount: string;
  dryDailyAmountUnit: 'grams' | 'cups';
  datePurchased: string;
};

export type WetFoodFormData = {
  brandName?: string;
  productName?: string;
  numberOfUnits: string; // String for form input
  weightPerUnit: string;
  wetWeightUnit: 'grams' | 'oz';
  dailyAmount: string;
  wetDailyAmountUnit: 'grams' | 'oz';
  datePurchased: string;
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