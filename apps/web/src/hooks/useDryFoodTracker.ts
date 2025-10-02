import { useState, useEffect, useCallback } from 'react';
import { dryFoodApi, foodApi, foodErrorHandler } from '@/lib/api/domains/food';
import type { DryFoodEntry, DryFoodFormData, WetFoodEntry } from '@/types/food';
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

  useEffect(() => {
    fetchDryFoodEntries();
  }, [fetchDryFoodEntries]);

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

  const markDryFoodAsFinished = useCallback(async (foodId: string): Promise<boolean> => {
    try {
      const finishedEntry = await foodApi.markFoodAsFinished(petId, foodId);
      
      // Update the local state to reflect the finished entry
      setDryFoodEntries(prev => 
        prev.map(entry => 
          entry.id === foodId 
            ? { ...finishedEntry } as DryFoodEntry
            : entry
        )
      );
      
    // Enhanced toast with consumption info
    if (finishedEntry.actualDaysElapsed && finishedEntry.feedingStatus) {
      const dryEntry = finishedEntry as DryFoodEntry;
      const totalWeightGrams = parseFloat(dryEntry.bagWeight) * (dryEntry.bagWeightUnit === 'kg' ? 1000 : 453.592);
      const dailyAmountGrams = parseFloat(dryEntry.dailyAmount) * (dryEntry.dryDailyAmountUnit === 'cups' ? 120 : 1);
      const expectedDays = Math.ceil(totalWeightGrams / dailyAmountGrams);
      
      const statusLabel = finishedEntry.feedingStatus === 'overfeeding' 
        ? 'Overfeeding' 
        : finishedEntry.feedingStatus === 'underfeeding' 
        ? 'Underfeeding' 
        : 'Normal feeding';
      
      toastService.success(
        `✅ Finished! Consumed in ${finishedEntry.actualDaysElapsed} days (expected ${expectedDays} days) Status: ${statusLabel}`
      );
    } else {
      toastService.success('Food entry marked as finished');
    }   
      return true;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to mark food entry as finished:', err);
      return false;
    }
  }, [petId]);

  const updateFinishDate = useCallback(async (foodId: string, dateFinished: string): Promise<DryFoodEntry | null> => {
    try {
      const updatedEntry = await foodApi.updateFinishDate(petId, foodId, dateFinished);
      
      setDryFoodEntries(prev => 
        prev.map(entry => 
          entry.id === foodId 
            ? { ...updatedEntry } as DryFoodEntry
            : entry
        )
      );
      
      // Enhanced toast with consumption info
      if (updatedEntry.actualDaysElapsed && updatedEntry.feedingStatus) {
        const dryEntry = updatedEntry as DryFoodEntry;
        const totalWeightGrams = parseFloat(dryEntry.bagWeight) * (dryEntry.bagWeightUnit === 'kg' ? 1000 : 453.592);
        const dailyAmountGrams = parseFloat(dryEntry.dailyAmount) * (dryEntry.dryDailyAmountUnit === 'cups' ? 120 : 1);
        const expectedDays = Math.ceil(totalWeightGrams / dailyAmountGrams);
        
        const statusLabel = updatedEntry.feedingStatus === 'overfeeding' 
          ? 'Overfeeding' 
          : updatedEntry.feedingStatus === 'underfeeding' 
          ? 'Underfeeding' 
          : 'Normal feeding';
        
        toastService.success(
          `✅ Finished! Consumed in ${updatedEntry.actualDaysElapsed} days (expected ${expectedDays} days) Status: ${statusLabel}`
        );
      } else {
        toastService.success('Finish date updated successfully');
      }
      
      return updatedEntry as DryFoodEntry;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to update finish date:', err);
      return null;
    }
  }, [petId]);

  // Filter food section active/low stock/history
  const activeDryFoodEntries = dryFoodEntries.filter(entry => entry.isActive);
  const lowStockDryFoodEntries = activeDryFoodEntries.filter(entry => entry.remainingDays !== undefined && entry.remainingDays <= 7 && entry.remainingDays > 0);
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
    markDryFoodAsFinished,
    updateFinishDate,
    refetchDryFoodEntries: fetchDryFoodEntries,
  };
}