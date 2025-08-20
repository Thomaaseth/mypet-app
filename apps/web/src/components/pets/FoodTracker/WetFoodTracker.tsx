import { useWetFoodTracker } from '@/hooks/useWetFoodTracker';
import { WetFoodForm } from './WetFoodForm';
import { WetFoodList } from './WetFoodList';
import { GenericFoodTracker } from './GenericFoodTracker';
import type { WetFoodEntry, WetFoodFormData } from '@/types/food';

interface WetFoodTrackerProps {
  petId: string;
  onDataChange?: () => Promise<void>;
}

export function WetFoodTracker({ petId, onDataChange }: WetFoodTrackerProps) {
  const hookResult = useWetFoodTracker({ petId });

  return (
    <GenericFoodTracker<WetFoodEntry, WetFoodFormData>
      petId={petId}
      foodType="wet"
      onDataChange={onDataChange}
      hookResult={{
        activeFoodEntries: hookResult.activeWetFoodEntries,
        finishedFoodEntries: hookResult.finishedWetFoodEntries,
        lowStockFoodEntries: hookResult.lowStockWetFoodEntries,
        isLoading: hookResult.isLoading,
        error: hookResult.error,
        createFoodEntry: hookResult.createWetFoodEntry,
        updateFoodEntry: hookResult.updateWetFoodEntry,
        deleteFoodEntry: hookResult.deleteWetFoodEntry,
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
      }}
    />
  );
}