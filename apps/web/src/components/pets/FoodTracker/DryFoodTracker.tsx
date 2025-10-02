'use client';

import { DryFoodForm } from './DryFoodForm';
import { DryFoodList } from './DryFoodList';
import { GenericFoodTracker } from './GenericFoodTracker';
import { useFoodTrackerContext } from './FoodTrackerContext';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';

export function DryFoodTracker() {
  // Use context
  const {
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
  } = useFoodTrackerContext();

  return (
    <GenericFoodTracker<DryFoodEntry, DryFoodFormData>
      foodType="dry"
      hookResult={{
        activeFoodEntries: activeDryFoodEntries,
        finishedFoodEntries: finishedDryFoodEntries,
        lowStockFoodEntries: lowStockDryFoodEntries,
        isLoading: isDryLoading,
        error: dryError,
        createFoodEntry: createDryFoodEntry,
        updateFoodEntry: updateDryFoodEntry,
        deleteFoodEntry: deleteDryFoodEntry,
        markFoodAsFinished: markDryFoodAsFinished,
        updateFinishDate: updateDryFinishDate,
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
        emptyTitle: 'No dry food tracked yet',
        emptyDescription: 'All current dry food has been finished. Add new dry food to continue tracking.',
        emptyButtonText: 'Add New Bag',
      }}
    />
  );
}