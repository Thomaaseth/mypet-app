import { createContext, useContext, ReactNode } from 'react';
import {
  useActiveDryFood,
  useFinishedDryFood,
  useCreateDryFood,
  useUpdateDryFood,
  useDeleteDryFood,
  useMarkDryFoodFinished,
  useUpdateDryFoodFinishDate,
  useActiveWetFood,
  useFinishedWetFood,
  useCreateWetFood,
  useUpdateWetFood,
  useDeleteWetFood,
  useMarkWetFoodFinished,
  useUpdateWetFoodFinishDate,
} from '@/queries/food';
import type { DryFoodEntry, WetFoodEntry, DryFoodFormData, WetFoodFormData } from '@/types/food';

interface FoodTrackerContextValue {
  // Dry food data and actions
  activeDryFoodEntries: DryFoodEntry[];
  finishedDryFoodEntries: DryFoodEntry[];
  lowStockDryFoodEntries: DryFoodEntry[];
  isDryLoading: boolean;
  dryError: string | null;
  createDryFoodEntry: (data: DryFoodFormData) => Promise<DryFoodEntry | null>;
  updateDryFoodEntry: (foodId: string, data: Partial<DryFoodFormData>) => Promise<DryFoodEntry | null>;
  deleteDryFoodEntry: (foodId: string) => Promise<boolean>;
  markDryFoodAsFinished: (foodId: string) => Promise<boolean>;
  updateDryFinishDate: (foodId: string, dateFinished: string) => Promise<DryFoodEntry | null>;

  // Wet food data and actions
  activeWetFoodEntries: WetFoodEntry[];
  finishedWetFoodEntries: WetFoodEntry[];
  lowStockWetFoodEntries: WetFoodEntry[];
  isWetLoading: boolean;
  wetError: string | null;
  createWetFoodEntry: (data: WetFoodFormData) => Promise<WetFoodEntry | null>;
  updateWetFoodEntry: (foodId: string, data: Partial<WetFoodFormData>) => Promise<WetFoodEntry | null>;
  deleteWetFoodEntry: (foodId: string) => Promise<boolean>;
  markWetFoodAsFinished: (foodId: string) => Promise<boolean>;
  updateWetFinishDate: (foodId: string, dateFinished: string) => Promise<WetFoodEntry | null>;

  // Combined data for summary
  activeFoodEntries: (DryFoodEntry | WetFoodEntry)[];
  isLoading: boolean;
}

const FoodTrackerContext = createContext<FoodTrackerContextValue | null>(null);

interface FoodTrackerProviderProps {
  petId: string;
  children: ReactNode;
}

export function FoodTrackerProvider({ petId, children }: FoodTrackerProviderProps) {
  console.log('🟡 FoodTrackerProvider RENDER with petId:', petId);

  // ============================================
  // DRY FOOD QUERIES & MUTATIONS
  // ============================================
  const activeDryQuery = useActiveDryFood(petId);
  const finishedDryQuery = useFinishedDryFood(petId);
  
  const createDryMutation = useCreateDryFood(petId);
  const updateDryMutation = useUpdateDryFood(petId);
  const deleteDryMutation = useDeleteDryFood(petId);
  const markDryFinishedMutation = useMarkDryFoodFinished(petId);
  const updateDryFinishDateMutation = useUpdateDryFoodFinishDate(petId);

  // ============================================
  // WET FOOD QUERIES & MUTATIONS
  // ============================================
  const activeWetQuery = useActiveWetFood(petId);
  const finishedWetQuery = useFinishedWetFood(petId);
  
  const createWetMutation = useCreateWetFood(petId);
  const updateWetMutation = useUpdateWetFood(petId);
  const deleteWetMutation = useDeleteWetFood(petId);
  const markWetFinishedMutation = useMarkWetFoodFinished(petId);
  const updateWetFinishDateMutation = useUpdateWetFoodFinishDate(petId);

  // ============================================
  // EXTRACT DATA FROM QUERIES
  // ============================================
  const activeDryFoodEntries = activeDryQuery.data?.entries ?? [];
  const lowStockDryFoodEntries = activeDryQuery.data?.lowStock ?? [];
  const finishedDryFoodEntries = finishedDryQuery.data ?? [];

  const activeWetFoodEntries = activeWetQuery.data?.entries ?? [];
  const lowStockWetFoodEntries = activeWetQuery.data?.lowStock ?? [];
  const finishedWetFoodEntries = finishedWetQuery.data ?? [];

  // ============================================
  // LOADING & ERROR STATES
  // ============================================
  const isDryLoading = activeDryQuery.isPending || finishedDryQuery.isPending;
  const isWetLoading = activeWetQuery.isPending || finishedWetQuery.isPending;
  const isLoading = isDryLoading || isWetLoading;

  const dryError = activeDryQuery.error?.message ?? finishedDryQuery.error?.message ?? null;
  const wetError = activeWetQuery.error?.message ?? finishedWetQuery.error?.message ?? null;

  // ============================================
  // MUTATION HANDLERS (wrap mutations to match expected interface)
  // ============================================
  
  // Dry food handlers
  const createDryFoodEntry = async (data: DryFoodFormData): Promise<DryFoodEntry | null> => {
    try {
      return await createDryMutation.mutateAsync(data);
    } catch {
      return null;
    }
  };

  const updateDryFoodEntry = async (
    foodId: string, 
    data: Partial<DryFoodFormData>
  ): Promise<DryFoodEntry | null> => {
    try {
      return await updateDryMutation.mutateAsync({ foodId, foodData: data });
    } catch {
      return null;
    }
  };

  const deleteDryFoodEntry = async (foodId: string): Promise<boolean> => {
    try {
      await deleteDryMutation.mutateAsync(foodId);
      return true;
    } catch {
      return false;
    }
  };

  const markDryFoodAsFinished = async (foodId: string): Promise<boolean> => {
    try {
      await markDryFinishedMutation.mutateAsync(foodId);
      return true;
    } catch {
      return false;
    }
  };

  const updateDryFinishDate = async (
    foodId: string, 
    dateFinished: string
  ): Promise<DryFoodEntry | null> => {
    try {
      const result = await updateDryFinishDateMutation.mutateAsync({ foodId, dateFinished });
      return result as DryFoodEntry;
    } catch {
      return null;
    }
  };

  // Wet food handlers
  const createWetFoodEntry = async (data: WetFoodFormData): Promise<WetFoodEntry | null> => {
    try {
      return await createWetMutation.mutateAsync(data);
    } catch {
      return null;
    }
  };

  const updateWetFoodEntry = async (
    foodId: string, 
    data: Partial<WetFoodFormData>
  ): Promise<WetFoodEntry | null> => {
    try {
      return await updateWetMutation.mutateAsync({ foodId, foodData: data });
    } catch {
      return null;
    }
  };

  const deleteWetFoodEntry = async (foodId: string): Promise<boolean> => {
    try {
      await deleteWetMutation.mutateAsync(foodId);
      return true;
    } catch {
      return false;
    }
  };

  const markWetFoodAsFinished = async (foodId: string): Promise<boolean> => {
    try {
      await markWetFinishedMutation.mutateAsync(foodId);
      return true;
    } catch {
      return false;
    }
  };

  const updateWetFinishDate = async (
    foodId: string, 
    dateFinished: string
  ): Promise<WetFoodEntry | null> => {
    try {
      const result = await updateWetFinishDateMutation.mutateAsync({ foodId, dateFinished });
      return result as WetFoodEntry;
    } catch {
      return null;
    }
  };

  // ============================================
  // COMBINED DATA
  // ============================================
  const activeFoodEntries = [...activeDryFoodEntries, ...activeWetFoodEntries];

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value: FoodTrackerContextValue = {
    // Dry food
    activeDryFoodEntries,
    finishedDryFoodEntries,
    lowStockDryFoodEntries,
    isDryLoading,
    dryError,
    createDryFoodEntry,
    updateDryFoodEntry,
    deleteDryFoodEntry,
    markDryFoodAsFinished,
    updateDryFinishDate,
    
    // Wet food
    activeWetFoodEntries,
    finishedWetFoodEntries,
    lowStockWetFoodEntries,
    isWetLoading,
    wetError,
    createWetFoodEntry,
    updateWetFoodEntry,
    deleteWetFoodEntry,
    markWetFoodAsFinished,
    updateWetFinishDate,
   
    // Combined
    activeFoodEntries,
    isLoading,
  };

  return (
    <FoodTrackerContext.Provider value={value}>
      {children}
    </FoodTrackerContext.Provider>
  );
}

export function useFoodTrackerContext() {
  const context = useContext(FoodTrackerContext);
  if (!context) {
    throw new Error('useFoodTrackerContext must be used within a FoodTrackerProvider');
  }
  return context;
}