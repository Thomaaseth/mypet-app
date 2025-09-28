import { useState, useEffect, useCallback } from 'react';
import { wetFoodApi, foodApi, foodErrorHandler } from '@/lib/api/domains/food';
import type { WetFoodEntry, WetFoodFormData } from '@/types/food';
import { toastService } from '@/lib/toast';

interface UseWetFoodTrackerOptions {
  petId: string;
}


export function useWetFoodTracker({ petId }: UseWetFoodTrackerOptions) {
  const [wetFoodEntries, setWetFoodEntries] = useState<WetFoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWetFoodEntries = useCallback(async () => {
    if (!petId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await wetFoodApi.getWetFoodEntries(petId);
      setWetFoodEntries(response.foodEntries);
    } catch (err) {
      const foodError = foodErrorHandler(err);
      setError(foodError.message);
      console.error('Failed to fetch wet food entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    fetchWetFoodEntries();
  }, [fetchWetFoodEntries]);

const createWetFoodEntry = useCallback(async (foodData: WetFoodFormData): Promise<WetFoodEntry | null> => {
    try {
      const newEntry = await wetFoodApi.createWetFoodEntry(petId, foodData);
      setWetFoodEntries(prev => [newEntry, ...prev]);

      toastService.success('Wet food entry added successfully');
      return newEntry;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to create wet food entry:', err);
      return null;
    }
  }, [petId]);

  const updateWetFoodEntry = useCallback(async (
    foodId: string, 
    foodData: Partial<WetFoodFormData>
  ): Promise<WetFoodEntry | null> => {
    try {
      const updatedEntry = await wetFoodApi.updateWetFoodEntry(petId, foodId, foodData);
      setWetFoodEntries(prev => 
        prev.map(entry => entry.id === foodId ? updatedEntry : entry)
      );
      toastService.success('Wet food entry updated successfully');
      return updatedEntry;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to update wet food entry:', err);
      return null;
    }
  }, [petId]);

  const deleteWetFoodEntry = useCallback(async (foodId: string): Promise<boolean> => {
    try {
      await foodApi.deleteFoodEntry(petId, foodId);
      setWetFoodEntries(prev => prev.filter(entry => entry.id !== foodId));
      toastService.success('Wet food entry deleted successfully');
      return true;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to delete wet food entry:', err);
      return false;
    }
  }, [petId]);

const markWetFoodAsFinished = useCallback(async (foodId: string): Promise<boolean> => {
  try {
    const finishedEntry = await foodApi.markFoodAsFinished(petId, foodId);
    
    // Update the local state to reflect the finished entry
    setWetFoodEntries(prev => 
      prev.map(entry => 
        entry.id === foodId 
          ? { ...finishedEntry } as WetFoodEntry
          : entry
      )
    );
    
    toastService.success('Food entry marked as finished');
    return true;
  } catch (err) {
    const foodError = foodErrorHandler(err);
    toastService.error(foodError.message);
    console.error('Failed to mark food entry as finished:', err);
    return false;
  }
}, [petId]);

  const activeWetFoodEntries = wetFoodEntries.filter(entry => entry.isActive);
  const lowStockWetFoodEntries = activeWetFoodEntries.filter(entry => entry.remainingDays <= 7 && entry.remainingDays > 0);
  const finishedWetFoodEntries = wetFoodEntries.filter(entry => !entry.isActive);

  return {
    wetFoodEntries: wetFoodEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    activeWetFoodEntries,
    lowStockWetFoodEntries,
    finishedWetFoodEntries,
    isLoading,
    error,
    createWetFoodEntry,
    updateWetFoodEntry,
    deleteWetFoodEntry,
    markWetFoodAsFinished,
    refetchWetFoodEntries: fetchWetFoodEntries,
  };
}