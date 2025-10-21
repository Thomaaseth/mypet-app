// Shared query keys for food
export const foodKeys = {
    all: ['food'] as const,
    dry: (petId: string) => ['food', 'dry', petId] as const,
    dryActive: (petId: string) => ['food', 'dry', petId, 'active'] as const,
    dryFinished: (petId: string) => ['food', 'dry', petId, 'finished'] as const,
    wet: (petId: string) => ['food', 'wet', petId] as const,
    wetActive: (petId: string) => ['food', 'wet', petId, 'active'] as const,
    wetFinished: (petId: string) => ['food', 'wet', petId, 'finished'] as const,
  }
  
  // Re-export all dry food hooks
  export {
    useActiveDryFood,
    useFinishedDryFood,
    useCreateDryFood,
    useUpdateDryFood,
    useDeleteDryFood,
    useMarkDryFoodFinished,
    useUpdateDryFoodFinishDate,
  } from './dryFood'
  
  // Re-export all wet food hooks
  export {
    useActiveWetFood,
    useFinishedWetFood,
    useCreateWetFood,
    useUpdateWetFood,
    useDeleteWetFood,
    useMarkWetFoodFinished,
    useUpdateWetFoodFinishDate,
  } from './wetFood'