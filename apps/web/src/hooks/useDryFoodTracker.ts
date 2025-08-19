// apps/web/src/hooks/useDryFoodTracker.ts
import { useState, useEffect, useCallback } from 'react';
import { dryFoodApi, foodApi, foodErrorHandler } from '@/lib/api/domains/food';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';
import { toastService } from '@/lib/toast';

interface UseDryFoodTrackerOptions {
  petId: string;
}

export function useDryFoodTracker({ petId }: UseDryFoodTrackerOptions) {
  const [dryFoodEntries, setDryFoodEntries] = useState<DryFoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDryFoodEntries = useCallback(async () => {
    if (!petId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await dryFoodApi.getDryFoodEntries(petId);
      setDryFoodEntries(response.foodEntries);
    } catch (err) {
      const foodError = foodErrorHandler(err);
      setError(foodError.message);
      console.error('Failed to fetch dry food entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  const createDryFoodEntry = useCallback(async (foodData: DryFoodFormData): Promise<DryFoodEntry | null> => {
    try {
      const newEntry = await dryFoodApi.createDryFoodEntry(petId, foodData);
      setDryFoodEntries(prev => [newEntry, ...prev]);
      toastService.success('Dry food entry added successfully');
      return newEntry;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to create dry food entry:', err);
      return null;
    }
  }, [petId]);

  const updateDryFoodEntry = useCallback(async (
    foodId: string, 
    foodData: Partial<DryFoodFormData>
  ): Promise<DryFoodEntry | null> => {
    try {
      const updatedEntry = await dryFoodApi.updateDryFoodEntry(petId, foodId, foodData);
      setDryFoodEntries(prev => 
        prev.map(entry => entry.id === foodId ? updatedEntry : entry)
      );
      toastService.success('Dry food entry updated successfully');
      return updatedEntry;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to update dry food entry:', err);
      return null;
    }
  }, [petId]);

  const deleteDryFoodEntry = useCallback(async (foodId: string): Promise<boolean> => {
    try {
      await foodApi.deleteFoodEntry(petId, foodId);
      setDryFoodEntries(prev => prev.filter(entry => entry.id !== foodId));
      toastService.success('Dry food entry deleted successfully');
      return true;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to delete dry food entry:', err);
      return false;
    }
  }, [petId]);

  useEffect(() => {
    fetchDryFoodEntries();
  }, [fetchDryFoodEntries]);

  const activeDryFoodEntries = dryFoodEntries.filter(entry => entry.isActive);
  const lowStockDryFoodEntries = activeDryFoodEntries.filter(entry => entry.remainingDays <= 7 && entry.remainingDays > 0);
  const finishedDryFoodEntries = dryFoodEntries.filter(entry => !entry.isActive);

  return {
    dryFoodEntries: dryFoodEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    activeDryFoodEntries,
    lowStockDryFoodEntries,
    finishedDryFoodEntries,
    isLoading,
    error,
    createDryFoodEntry,
    updateDryFoodEntry,
    deleteDryFoodEntry,
    refetchDryFoodEntries: fetchDryFoodEntries,
  };
}