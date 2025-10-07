import { useState, useEffect, useCallback } from 'react';
import { dryFoodApi, foodApi, foodErrorHandler } from '@/lib/api/domains/food';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';
import { toastService } from '@/lib/toast';

interface UseDryFoodTrackerOptions {
  petId: string;
}

export function useDryFoodTracker({ petId }: UseDryFoodTrackerOptions) {
  // Separate state for active and finished entries
  const [activeDryFoodEntries, setActiveDryFoodEntries] = useState<DryFoodEntry[]>([]);
  const [finishedDryFoodEntries, setFinishedDryFoodEntries] = useState<DryFoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch active entries
  const fetchActiveDryFoodEntries = useCallback(async () => {
    if (!petId) return;
    
    try {
      setError(null);
      const response = await dryFoodApi.getDryFoodEntries(petId);
      setActiveDryFoodEntries(response.foodEntries);
    } catch (err) {
      const foodError = foodErrorHandler(err);
      setError(foodError.message);
      console.error('Failed to fetch active dry food entries:', err);
    }
  }, [petId]);

  // Fetch finished entries
  const fetchFinishedDryFoodEntries = useCallback(async () => {
    if (!petId) return;
    
    try {
      setError(null);
      const response = await dryFoodApi.getFinishedDryFoodEntries(petId);
      setFinishedDryFoodEntries(response.foodEntries);
    } catch (err) {
      const foodError = foodErrorHandler(err);
      setError(foodError.message);
      console.error('Failed to fetch finished dry food entries:', err);
    }
  }, [petId]);

  // Fetch both on mount
  useEffect(() => {
    console.log('🔴 DRY HOOK MOUNT - Fetching dry food for pet:', petId);

    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchActiveDryFoodEntries(),
        fetchFinishedDryFoodEntries()
      ]);
      setIsLoading(false);
    };

    fetchAllData();
  }, [fetchActiveDryFoodEntries, fetchFinishedDryFoodEntries]);

  const createDryFoodEntry = useCallback(async (foodData: DryFoodFormData): Promise<DryFoodEntry | null> => {
    try {
      const newEntry = await dryFoodApi.createDryFoodEntry(petId, foodData);
      
      // Optimistically add to active entries
      setActiveDryFoodEntries(prev => [newEntry, ...prev]);

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
      
      // Optimistically update in active entries
      setActiveDryFoodEntries(prev => 
        prev.map(entry => entry.id === foodId ? { ...updatedEntry } as DryFoodEntry : entry)
      );
      
      toastService.success('Dry food entry updated successfully');
      return updatedEntry as DryFoodEntry;
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
      
      // Remove from whichever state has it
      setActiveDryFoodEntries(prev => prev.filter(entry => entry.id !== foodId));
      setFinishedDryFoodEntries(prev => prev.filter(entry => entry.id !== foodId));
      
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
      
      // Move from active to finished
      setActiveDryFoodEntries(prev => prev.filter(entry => entry.id !== foodId));
      setFinishedDryFoodEntries(prev => [finishedEntry as DryFoodEntry, ...prev]);
      
      // Enhanced toast with consumption info
      if (finishedEntry.actualDaysElapsed && finishedEntry.feedingStatus) {
        const dryEntry = finishedEntry as DryFoodEntry;
        const totalWeightGrams = parseFloat(dryEntry.bagWeight) * (dryEntry.bagWeightUnit === 'kg' ? 1000 : 453.592);
        const dailyAmountGrams = parseFloat(dryEntry.dailyAmount) * (dryEntry.dryDailyAmountUnit === 'cups' ? 120 : 1);
        const expectedDays = Math.ceil(totalWeightGrams / dailyAmountGrams);
        
        const statusLabel = 
          finishedEntry.feedingStatus === 'overfeeding' ? 'Overfeeding' :
          finishedEntry.feedingStatus === 'slightly-over' ? 'Slightly Over' :
          finishedEntry.feedingStatus === 'underfeeding' ? 'Underfeeding' :
          finishedEntry.feedingStatus === 'slightly-under' ? 'Slightly Under' :
          'Normal feeding';
        
        toastService.success(
          `✅ Finished! Consumed in ${finishedEntry.actualDaysElapsed} days (expected ${expectedDays} days). Status: ${statusLabel}`
        );
      } else {
        toastService.success('Dry food marked as finished');
      }
      
      return true;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to mark dry food as finished:', err);
      return false;
    }
  }, [petId]);

  const updateFinishDate = useCallback(async (foodId: string, dateFinished: string): Promise<DryFoodEntry | null> => {
    try {
      const updatedEntry = await foodApi.updateFinishDate(petId, foodId, dateFinished);
      
      // Update in finished entries
      setFinishedDryFoodEntries(prev => 
        prev.map(entry => entry.id === foodId ? { ...updatedEntry } as DryFoodEntry : entry)
      );
      
      // Enhanced toast with consumption info
      if (updatedEntry.actualDaysElapsed && updatedEntry.feedingStatus) {
        const dryEntry = updatedEntry as DryFoodEntry;
        const totalWeightGrams = parseFloat(dryEntry.bagWeight) * (dryEntry.bagWeightUnit === 'kg' ? 1000 : 453.592);
        const dailyAmountGrams = parseFloat(dryEntry.dailyAmount) * (dryEntry.dryDailyAmountUnit === 'cups' ? 120 : 1);
        const expectedDays = Math.ceil(totalWeightGrams / dailyAmountGrams);
        
        const statusLabel = 
          updatedEntry.feedingStatus === 'overfeeding' ? 'Overfeeding' :
          updatedEntry.feedingStatus === 'slightly-over' ? 'Slightly Over' :
          updatedEntry.feedingStatus === 'underfeeding' ? 'Underfeeding' :
          updatedEntry.feedingStatus === 'slightly-under' ? 'Slightly Under' :
          'Normal feeding';
        
        toastService.success(
          `✅ Finished! Consumed in ${updatedEntry.actualDaysElapsed} days (expected ${expectedDays} days). Status: ${statusLabel}`
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

  // Calculate low stock from active entries
  const lowStockDryFoodEntries = activeDryFoodEntries.filter(
    entry => entry.remainingDays !== undefined && entry.remainingDays <= 7 && entry.remainingDays > 0
  );

  return {
    activeDryFoodEntries,
    finishedDryFoodEntries,
    lowStockDryFoodEntries,
    isLoading,
    error,
    createDryFoodEntry,
    updateDryFoodEntry,
    deleteDryFoodEntry,
    markDryFoodAsFinished,
    updateFinishDate,
    refetchDryFoodEntries: async () => {
      await Promise.all([
        fetchActiveDryFoodEntries(),
        fetchFinishedDryFoodEntries()
      ]);
    },
  };
}