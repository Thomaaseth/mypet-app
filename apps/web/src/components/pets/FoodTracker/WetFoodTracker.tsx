'use client';

import { WetFoodForm } from './WetFoodForm';
import { WetFoodList } from './WetFoodList';
import { GenericFoodTracker } from './GenericFoodTracker';
import { useFoodTrackerContext } from './FoodTrackerContext';
import type { WetFoodEntry, WetFoodFormData } from '@/types/food';

export function WetFoodTracker() {
  // Use context
  const {
    activeWetFoodEntries,
    finishedWetFoodEntries,
    lowStockWetFoodEntries,
    isWetLoading,
    wetError,
    createWetFoodEntry,
    updateWetFoodEntry,
    deleteWetFoodEntry,
    markWetFoodAsFinished,
  } = useFoodTrackerContext();

  return (
    <GenericFoodTracker<WetFoodEntry, WetFoodFormData>
      foodType="wet"
      hookResult={{
        activeFoodEntries: activeWetFoodEntries,
        finishedFoodEntries: finishedWetFoodEntries,
        lowStockFoodEntries: lowStockWetFoodEntries,
        isLoading: isWetLoading,
        error: wetError,
        createFoodEntry: createWetFoodEntry,
        updateFoodEntry: updateWetFoodEntry,
        deleteFoodEntry: deleteWetFoodEntry,
        markFoodAsFinished: markWetFoodAsFinished,
      }}
      FormComponent={WetFoodForm}
      ListComponent={WetFoodList}
      labels={{
        addButton: 'Add Wet Food',
        dialogTitle: 'Add New Wet Food Entry',
        dialogDescription: 'Track new cans/pouches of wet food for your pet.',
        entriesTitle: 'Wet Food Entries',
        alertSingular: 'entry',
        alertPlural: 'entries',
        emptyTitle: 'No wet food tracked yet',
        emptyDescription: 'All current wet food has been finished. Add new wet food to continue tracking.',
        emptyButtonText: 'Add First Cans',
      }}
    />
  );
}