// import type {
//     DryFoodEntry,
//     WetFoodEntry,
//     DryFoodFormData,
//     WetFoodFormData,
//     DryFoodEntriesApiResponse,
//     WetFoodEntriesApiResponse,
//     AllFoodEntriesApiResponse
//   } from '@/types/food';
  
//   // Re-export all the types
//   export type {
//     DryFoodEntry,
//     WetFoodEntry,
//     DryFoodFormData,
//     WetFoodFormData,
//     DryFoodEntriesApiResponse,
//     WetFoodEntriesApiResponse,
//     AllFoodEntriesApiResponse
//   };

import type {
  DryFoodEntry,
  WetFoodEntry,
  DryFoodFormData,
  WetFoodFormData,
} from '@/types/food';

export type {
  DryFoodEntry,
  WetFoodEntry,
  DryFoodFormData,
  WetFoodFormData,
};
  
export interface FoodError {
  message: string;
  field?: keyof (DryFoodFormData & WetFoodFormData);
  code: string;
}
