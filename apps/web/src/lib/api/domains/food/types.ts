import type {
    DryFoodEntry,
    WetFoodEntry,
    DryFoodFormData,
    WetFoodFormData,
    DryFoodEntriesApiResponse,
    WetFoodEntriesApiResponse,
    AllFoodEntriesApiResponse
  } from '@/types/food';
  
  // Re-export all the types
  export type {
    DryFoodEntry,
    WetFoodEntry,
    DryFoodFormData,
    WetFoodFormData,
    DryFoodEntriesApiResponse,
    WetFoodEntriesApiResponse,
    AllFoodEntriesApiResponse
  };
  
  export interface FoodError {
    message: string;
    field?: keyof (DryFoodFormData & WetFoodFormData);
    code: string;
  }
  
  export type FoodEntriesApiResponse = DryFoodEntriesApiResponse | WetFoodEntriesApiResponse | AllFoodEntriesApiResponse;