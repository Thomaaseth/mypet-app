// DryFoodFormData/WetFoodFormData are the single source of truth from the shared Zod schema
export type { DryFoodFormData, WetFoodFormData } from '@/shared/validations/food';


export type FoodType = 'dry' | 'wet';

// Separate, clean types mirrors the API's DryFoodEntry/WetFoodEntry
export type DryFoodEntry = {
  id: string;
  petId: string;
  foodType: 'dry';
  brandName: string | null;
  productName: string | null;
  bagWeight: string; // canonical grams
  dailyAmount: string; // canonical grams
  dateStarted: string;
  dateFinished: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Wet food fields (null for dry)
  numberOfUnits: null;
  weightPerUnit: null;
  
  // Calculated fields for active entries
  remainingDays?: number;
  remainingWeight?: number;
  depletionDate?: string;  // String from API
  
  // Calculated fields for finished entries
  actualDaysElapsed?: number;
  actualDailyConsumption?: number;
  expectedDailyConsumption?: number;
  variancePercentage?: number;
  feedingStatus?: 'overfeeding' | 'slightly-over' | 'normal' | 'slightly-under' | 'underfeeding';
};

export type WetFoodEntry = {
  id: string;
  petId: string;
  foodType: 'wet';
  brandName: string | null;
  productName: string | null;
  numberOfUnits: number;
  weightPerUnit: string; // canonical grams
  dailyAmount: string; // canonical grams
  dateStarted: string;
  dateFinished: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Dry food fields (null for wet)
  bagWeight: null;

  // Calculated fields for active entries
  remainingDays?: number;
  remainingWeight?: number;
  depletionDate?: string;
  
  // Calculated fields for finished entries
  actualDaysElapsed?: number;
  actualDailyConsumption?: number;
  expectedDailyConsumption?: number;
  variancePercentage?: number;
  feedingStatus?: 'overfeeding' | 'slightly-over' | 'normal' | 'slightly-under' | 'underfeeding';
};

