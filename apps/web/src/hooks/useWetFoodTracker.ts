import { useState, useEffect, useCallback } from 'react';
import { wetFoodApi, foodApi, foodErrorHandler } from '@/lib/api/domains/food';
import type { WetFoodEntry, WetFoodFormData } from '@/types/food';
import { toastService } from '@/lib/toast';

interface UseWetFoodTrackerOptions {
  petId: string;
}

export function useWetFoodTracker({ petId }: UseWetFoodTrackerOptions) {
  // Separate state for active and finished entries
  const [activeWetFoodEntries, setActiveWetFoodEntries] = useState<WetFoodEntry[]>([]);
  const [finishedWetFoodEntries, setFinishedWetFoodEntries] = useState<WetFoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch active entries
  const fetchActiveWetFoodEntries = useCallback(async () => {
    if (!petId) return;
    
    try {
      setError(null);
      const response = await wetFoodApi.getWetFoodEntries(petId);
      setActiveWetFoodEntries(response.foodEntries);
    } catch (err) {
      const foodError = foodErrorHandler(err);
      setError(foodError.message);
      console.error('Failed to fetch active wet food entries:', err);
    }
  }, [petId]);

  // Fetch finished entries
  const fetchFinishedWetFoodEntries = useCallback(async () => {
    if (!petId) return;
    
    try {
      setError(null);
      const response = await wetFoodApi.getFinishedWetFoodEntries(petId);
      // Sort by dateFinished DESC (most recent first)
      const sortedEntries = [...response.foodEntries].sort((a, b) => {
        if (!a.dateFinished || !b.dateFinished) return 0;
        return new Date(b.dateFinished).getTime() - new Date(a.dateFinished).getTime();
      });
      setFinishedWetFoodEntries(sortedEntries);
    } catch (err) {
      const foodError = foodErrorHandler(err);
      setError(foodError.message);
      console.error('Failed to fetch finished wet food entries:', err);
    }
  }, [petId]);

  // Fetch both on mount
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchActiveWetFoodEntries(),
        fetchFinishedWetFoodEntries()
      ]);
      setIsLoading(false);
    };

    fetchAllData();
  }, [fetchActiveWetFoodEntries, fetchFinishedWetFoodEntries]);

  const createWetFoodEntry = useCallback(async (foodData: WetFoodFormData): Promise<WetFoodEntry | null> => {
    try {
      const newEntry = await wetFoodApi.createWetFoodEntry(petId, foodData);
      
      // Optimistically add to active entries
      setActiveWetFoodEntries(prev => [newEntry, ...prev]);

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
      
      // Optimistically update in active entries
      setActiveWetFoodEntries(prev => 
        prev.map(entry => entry.id === foodId ? { ...updatedEntry } as WetFoodEntry : entry)
      );
      
      toastService.success('Wet food entry updated successfully');
      return updatedEntry as WetFoodEntry;
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
      
      // Remove from whichever state has it
      setActiveWetFoodEntries(prev => prev.filter(entry => entry.id !== foodId));
      setFinishedWetFoodEntries(prev => prev.filter(entry => entry.id !== foodId));
      
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
      
      // Move from active to finished
      setActiveWetFoodEntries(prev => prev.filter(entry => entry.id !== foodId));
      setFinishedWetFoodEntries(prev => [finishedEntry as WetFoodEntry, ...prev]);
      
      // Enhanced toast with consumption info
      if (finishedEntry.actualDaysElapsed && finishedEntry.feedingStatus) {
        const wetEntry = finishedEntry as WetFoodEntry;
        const totalWeightGrams = wetEntry.numberOfUnits * parseFloat(wetEntry.weightPerUnit) * (wetEntry.wetWeightUnit === 'oz' ? 28.3495 : 1);
        const dailyAmountGrams = parseFloat(wetEntry.dailyAmount) * (wetEntry.wetDailyAmountUnit === 'oz' ? 28.3495 : 1);
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
        toastService.success('Wet food marked as finished');
      }
      
      return true;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to mark wet food as finished:', err);
      return false;
    }
  }, [petId]);

  const updateFinishDate = useCallback(async (foodId: string, dateFinished: string): Promise<WetFoodEntry | null> => {
    try {
      const updatedEntry = await foodApi.updateFinishDate(petId, foodId, dateFinished);
      
      // Update in finished entries and maintain sort order
      setFinishedWetFoodEntries(prev => {
        const updated = prev.map(entry => 
          entry.id === foodId ? { ...updatedEntry } as WetFoodEntry : entry
        );
        // Re-sort by dateFinished DESC after update
        return updated.sort((a, b) => {
          if (!a.dateFinished || !b.dateFinished) return 0;
          return new Date(b.dateFinished).getTime() - new Date(a.dateFinished).getTime();
        });
      });
      
      // Enhanced toast with consumption info
      if (updatedEntry.actualDaysElapsed && updatedEntry.feedingStatus) {
        const wetEntry = updatedEntry as WetFoodEntry;
        const totalWeightGrams = wetEntry.numberOfUnits * parseFloat(wetEntry.weightPerUnit) * (wetEntry.wetWeightUnit === 'oz' ? 28.3495 : 1);
        const dailyAmountGrams = parseFloat(wetEntry.dailyAmount) * (wetEntry.wetDailyAmountUnit === 'oz' ? 28.3495 : 1);
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
      
      return updatedEntry as WetFoodEntry;
    } catch (err) {
      const foodError = foodErrorHandler(err);
      toastService.error(foodError.message);
      console.error('Failed to update finish date:', err);
      return null;
    }
  }, [petId]);

  // Calculate low stock from active entries
  const lowStockWetFoodEntries = activeWetFoodEntries.filter(
    entry => entry.remainingDays !== undefined && entry.remainingDays <= 7 && entry.remainingDays > 0
  );

  return {
    activeWetFoodEntries,
    finishedWetFoodEntries,
    lowStockWetFoodEntries,
    isLoading,
    error,
    createWetFoodEntry,
    updateWetFoodEntry,
    deleteWetFoodEntry,
    markWetFoodAsFinished,
    updateFinishDate,
    refetchWetFoodEntries: async () => {
      await Promise.all([
        fetchActiveWetFoodEntries(),
        fetchFinishedWetFoodEntries()
      ]);
    },
  };
}