'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useDryFoodTracker } from '@/hooks/useDryFoodTracker';
import { useWetFoodTracker } from '@/hooks/useWetFoodTracker';
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

  // Single instances of hooks at the provider level
  const {
    activeDryFoodEntries,
    finishedDryFoodEntries,
    lowStockDryFoodEntries,
    isLoading: isDryLoading,
    error: dryError,
    createDryFoodEntry,
    updateDryFoodEntry,
    deleteDryFoodEntry,
    markDryFoodAsFinished,
    updateFinishDate: updateDryFinishDate,
  } = useDryFoodTracker({ petId });

  const {
    activeWetFoodEntries,
    finishedWetFoodEntries,
    lowStockWetFoodEntries,
    isLoading: isWetLoading,
    error: wetError,
    createWetFoodEntry,
    updateWetFoodEntry,
    deleteWetFoodEntry,
    markWetFoodAsFinished,
    updateFinishDate: updateWetFinishDate,
  } = useWetFoodTracker({ petId });

  // Combined data for summary
  const activeFoodEntries = [...activeDryFoodEntries, ...activeWetFoodEntries];
  const isLoading = isDryLoading || isWetLoading;

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