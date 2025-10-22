// import { useState, useEffect, useCallback } from 'react';
// import { weightApi, weightErrorHandler } from '@/lib/api/domains/weights';
// import type { 
//   WeightEntry, 
//   WeightFormData, 
//   WeightEntriesApiResponse,
//   WeightChartData 
// } from '@/types/weights';
// import type { WeightUnit } from '@/types/pet';
// import { formatDateForDisplay } from '@/lib/validations/weight';
// import { toastService } from '@/lib/toast';

// interface UseWeightTrackerOptions {
//   petId: string;
//   weightUnit: WeightUnit;
// }

// export function useWeightTracker({ petId, weightUnit }: UseWeightTrackerOptions) {
//   const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchWeightEntries = useCallback(async () => {
//     if (!petId) return;
    
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       const response: WeightEntriesApiResponse = await weightApi.getWeightEntries(petId);
//       setWeightEntries(response.weightEntries);
//     } catch (err) {
//       const weightError = weightErrorHandler(err);
//       setError(weightError.message);
//       console.error('Failed to fetch weight entries:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [petId]);

//   const createWeightEntry = useCallback(async (weightData: WeightFormData): Promise<WeightEntry | null> => {
//     try {
//       const newEntry = await weightApi.createWeightEntry(petId, weightData, weightUnit);
      
//       // Update local state optimistically
//       setWeightEntries(prev => [...prev, newEntry]);
      
//       toastService.success('Weight entry added successfully');
//       return newEntry;
//     } catch (err) {
//       const weightError = weightErrorHandler(err);
//       toastService.error(weightError.message);
//       console.error('Failed to create weight entry:', err);
//       return null;
//     }
//   }, [petId, weightUnit]);

//   const updateWeightEntry = useCallback(async (
//     weightId: string, 
//     weightData: Partial<WeightFormData>
//   ): Promise<WeightEntry | null> => {
//     try {
//       const updatedEntry = await weightApi.updateWeightEntry(petId, weightId, weightData, weightUnit);
      
//       // Update local state
//       setWeightEntries(prev => 
//         prev.map(entry => 
//           entry.id === weightId ? updatedEntry : entry
//         )
//       );
      
//       toastService.success('Weight entry updated successfully');
//       return updatedEntry;
//     } catch (err) {
//       const weightError = weightErrorHandler(err);
//       toastService.error(weightError.message);
//       console.error('Failed to update weight entry:', err);
//       return null;
//     }
//   }, [petId, weightUnit]);

//   const deleteWeightEntry = useCallback(async (weightId: string): Promise<boolean> => {
//     try {
//       await weightApi.deleteWeightEntry(petId, weightId);
      
//       // Update local state
//       setWeightEntries(prev => prev.filter(entry => entry.id !== weightId));
      
//       toastService.success('Weight entry deleted successfully');
//       return true;
//     } catch (err) {
//       const weightError = weightErrorHandler(err);
//       toastService.error(weightError.message);
//       console.error('Failed to delete weight entry:', err);
//       return false;
//     }
//   }, [petId]);

//   // Get sorted weight entries (oldest to newest for chart)
//   const sortedWeightEntries = weightEntries.sort((a, b) => 
//     new Date(a.date).getTime() - new Date(b.date).getTime()
//   );

//   // Convert to chart data format
//   const chartData: WeightChartData[] = sortedWeightEntries.map(entry => ({
//     date: formatDateForDisplay(entry.date),
//     weight: parseFloat(entry.weight),
//     originalDate: entry.date,
//   }));

//   const latestWeight = sortedWeightEntries.length > 0 
//     ? sortedWeightEntries[sortedWeightEntries.length - 1] 
//     : null;

//   // Fetch data on mount and when petId changes
//   useEffect(() => {
//     fetchWeightEntries();
//   }, [fetchWeightEntries]);

//   return {
//     // Data
//     weightEntries: sortedWeightEntries,
//     chartData,
//     latestWeight,
    
//     // State
//     isLoading,
//     error,
    
//     // Actions
//     createWeightEntry,
//     updateWeightEntry,
//     deleteWeightEntry,
//     refetchWeightEntries: fetchWeightEntries,
//   };
// }