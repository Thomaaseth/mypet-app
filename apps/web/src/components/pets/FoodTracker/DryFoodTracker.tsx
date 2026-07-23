import { DryFoodForm } from './DryFoodForm';
import { DryFoodList } from './DryFoodList';
import { GenericFoodTracker } from './GenericFoodTracker';
import { useFoodTrackerContext } from './FoodTrackerContext';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';
import { useTranslation } from 'react-i18next';

export function DryFoodTracker() {
  const { t } = useTranslation();

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
        addButton: t('food.dry.addButton'),
        dialogTitle: t('food.dry.dialogTitle'),
        dialogDescription: t('food.dry.dialogDescription'),
        entriesTitle: t('food.dry.entriesTitle'),
        emptyTitle: t('food.dry.emptyTitle'),
        emptyDescription: t('food.dry.emptyDescription'),
        emptyButtonText: t('food.dry.emptyButtonText'),
      }}
    />
  );
}