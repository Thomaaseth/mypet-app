'use client';

import { useDryFoodTracker } from '@/hooks/useDryFoodTracker';
import { DryFoodForm } from './DryFoodForm';
import { DryFoodList } from './DryFoodList';
import { GenericFoodTracker } from './GenericFoodTracker';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';

interface DryFoodTrackerProps {
  petId: string;
  onDataChange?: () => Promise<void>; 
}

export function DryFoodTracker({ petId, onDataChange }: DryFoodTrackerProps) {
  const hookResult = useDryFoodTracker({ petId });

  return (
    <GenericFoodTracker<DryFoodEntry, DryFoodFormData>
      petId={petId}
      foodType="dry"
      onDataChange={onDataChange}
      hookResult={{
        activeFoodEntries: hookResult.activeDryFoodEntries,
        finishedFoodEntries: hookResult.finishedDryFoodEntries,
        lowStockFoodEntries: hookResult.lowStockDryFoodEntries,
        isLoading: hookResult.isLoading,
        error: hookResult.error,
        createFoodEntry: hookResult.createDryFoodEntry,
        updateFoodEntry: hookResult.updateDryFoodEntry,
        deleteFoodEntry: hookResult.deleteDryFoodEntry,
      }}
      FormComponent={DryFoodForm}
      ListComponent={DryFoodList}
      labels={{
        addButton: 'Add Dry Food',
        dialogTitle: 'Add New Dry Food Entry',
        dialogDescription: 'Track new bags of dry food for your pet.',
        entriesTitle: 'Dry Food Entries',
        alertSingular: 'entry',
        alertPlural: 'entries',
      }}
    />
  );
}