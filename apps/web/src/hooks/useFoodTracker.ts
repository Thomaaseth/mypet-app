import { useState, useEffect, useCallback } from 'react';
import { foodApi, foodErrorHandler } from '@/lib/api/domains/food';
import type { 
  FoodEntry, 
  FoodFormData, 
  FoodEntriesApiResponse,
  FoodType
} from '@/types/food';
import { toastService } from '@/lib/toast';

interface UseFoodTrackerOptions {
  petId: string;
}

export function useFoodTracker({ petId }: UseFoodTrackerOptions) {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch food entries
  const fetchFoodEntries = useCallback(async () => {
    if (!petId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response: FoodEntriesApiResponse = await foodApi.getFoodEntries(petId);
      setFoodEntries(response.foodEntries);
    } catch (err) {
      const foodError = foodErrorHandler(err);
      setError(foodError.message);
      console.error('Failed to fetch food entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  // Fetch food entries by type
  const fetchFoodEntriesByType = useCallback(async (foodType: FoodType) => {
    if (!petId) return [];
    
    try {
      const response: FoodEntriesApiResponse = await foodApi.getFoodEntriesByType(petId, foodType);
      return response.foodEntries;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      console.error(`Failed to fetch ${foodType} food entries:`, foodError);
      return [];
    }
  }, [petId]);

  // Create food entry
  const createFoodEntry = useCallback(async (foodData: FoodFormData): Promise<FoodEntry | null> => {
    try {
      const newEntry = await foodApi.createFoodEntry(petId, foodData);
      
      // Update local state optimistically
      setFoodEntries(prev => [newEntry, ...prev]);
      
      toastService.success('Food entry added successfully');
      return newEntry;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to create food entry:', err);
      return null;
    }
  }, [petId]);

  // Update food entry
  const updateFoodEntry = useCallback(async (
    foodId: string, 
    foodData: Partial<FoodFormData>
  ): Promise<FoodEntry | null> => {
    try {
      const updatedEntry = await foodApi.updateFoodEntry(petId, foodId, foodData);
      
      // Update local state
      setFoodEntries(prev => 
        prev.map(entry => 
          entry.id === foodId ? updatedEntry : entry
        )
      );
      
      toastService.success('Food entry updated successfully');
      return updatedEntry;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to update food entry:', err);
      return null;
    }
  }, [petId]);

  // Delete food entry
  const deleteFoodEntry = useCallback(async (foodId: string): Promise<boolean> => {
    try {
      await foodApi.deleteFoodEntry(petId, foodId);
      
      // Update local state
      setFoodEntries(prev => prev.filter(entry => entry.id !== foodId));
      
      toastService.success('Food entry deleted successfully');
      return true;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to delete food entry:', err);
      return false;
    }
  }, [petId]);

  // Get food entries by type from current state
  const getFoodEntriesByType = useCallback((foodType: FoodType): FoodEntry[] => {
    return foodEntries.filter(entry => entry.foodType === foodType);
  }, [foodEntries]);

  const sortedFoodEntries = foodEntries.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const activeFoodEntries = sortedFoodEntries.filter(entry => entry.isActive && entry.remainingDays > 0);

  // Get entries that are running low (less than 7 days remaining)
  const lowStockEntries = activeFoodEntries.filter(entry => entry.remainingDays <= 7 && entry.remainingDays > 0);

  // Get entries that are finished
  const finishedEntries = activeFoodEntries.filter(entry => entry.remainingDays <= 0);

  // Fetch data on mount and when petId changes
  useEffect(() => {
    fetchFoodEntries();
  }, [fetchFoodEntries]);

  return {
    // Data
    foodEntries: sortedFoodEntries,
    activeFoodEntries,
    lowStockEntries,
    finishedEntries,
    
    // State
    isLoading,
    error,
    
    // Actions
    createFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    refetchFoodEntries: fetchFoodEntries,
    
    // Utilities
    getFoodEntriesByType,
    fetchFoodEntriesByType,
  };
}