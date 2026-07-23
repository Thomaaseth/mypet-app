import { WetFoodForm } from './WetFoodForm';
import { WetFoodList } from './WetFoodList';
import { GenericFoodTracker } from './GenericFoodTracker';
import { useFoodTrackerContext } from './FoodTrackerContext';
import type { WetFoodEntry, WetFoodFormData } from '@/types/food';
import { useTranslation } from 'react-i18next';

export function WetFoodTracker() {
  const { t } = useTranslation();

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
    updateWetFinishDate,
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
        updateFinishDate: updateWetFinishDate,
      }}
      FormComponent={WetFoodForm}
      ListComponent={WetFoodList}
      labels={{
        addButton: t('food.wet.addButton'),
        dialogTitle: t('food.wet.dialogTitle'),
        dialogDescription: t('food.wet.dialogDescription'),
        entriesTitle: t('food.wet.entriesTitle'),
        emptyTitle: t('food.wet.emptyTitle'),
        emptyDescription: t('food.wet.emptyDescription'),
        emptyButtonText: t('food.wet.emptyButtonText'),
      }}
    />
  );
}