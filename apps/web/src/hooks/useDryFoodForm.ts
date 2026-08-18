import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dryFoodSchema, type DryFoodFormData } from '@/lib/validations/food';
import type { DryFoodEntry } from '@/types/food';
import { convertFoodWeight, formatWeight } from '@/lib/validations/pet';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getTodayDateString } from '@/lib/utils/date-formatting';


// Single source of truth for mapping a stored entry onto form fields.
// Reused by edit, renew, and resetWithDryFoodEntry.
function dryFoodEntryToFormValues(
  entry: DryFoodEntry,
  bagWeightUnit: DryFoodFormData['bagWeightUnit'],
): DryFoodFormData {
  return {
    brandName: entry.brandName ?? undefined,
    productName: entry.productName ?? undefined,
    bagWeight: formatWeight(convertFoodWeight(parseFloat(entry.bagWeight), 'grams', bagWeightUnit)),
    bagWeightUnit,
    dailyAmount: formatWeight(parseFloat(entry.dailyAmount)),
    dateStarted: entry.dateStarted,
  };
}

interface UseDryFoodFormOptions {
  dryFoodEntry?: DryFoodEntry;
  renewFrom?: DryFoodEntry;
  defaultValues?: Partial<DryFoodFormData>;
}

export function useDryFoodForm(options: UseDryFoodFormOptions = {}) {
  const { dryFoodEntry, renewFrom, defaultValues } = options;
  const { units } = usePreferencesContext();
  const bagWeightUnit = units?.bagWeightUnit ?? 'kg';

  const schema = dryFoodSchema;

  const getInitialValues = (): DryFoodFormData => {
    if (dryFoodEntry) {
      return dryFoodEntryToFormValues(dryFoodEntry, bagWeightUnit);
    }

    if (renewFrom) {
      // Renew: prefill like edit, blank the date (create mode).
      return { ...dryFoodEntryToFormValues(renewFrom, bagWeightUnit), dateStarted: '' };
    }

    return {
      bagWeight: '',
      bagWeightUnit,
      dailyAmount: '',
      dateStarted: getTodayDateString(),
      ...defaultValues,
    };
  };

  const form = useForm<DryFoodFormData>({
    resolver: zodResolver(schema),
    defaultValues: getInitialValues(),
    shouldFocusError: false,
  });

  const resetWithDryFoodEntry = (newDryFoodEntry: DryFoodEntry) => {
    form.reset(dryFoodEntryToFormValues(newDryFoodEntry, bagWeightUnit));
  };

  const resetToEmpty = () => {
    form.reset({
      bagWeight: '',
      bagWeightUnit,
      dailyAmount: '',
      dateStarted: getTodayDateString(),
      ...defaultValues,
    });
  };

  return {
    ...form,
    resetWithDryFoodEntry,
    resetToEmpty,
  };
}