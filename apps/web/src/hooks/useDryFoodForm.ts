import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dryFoodSchema, type DryFoodFormData } from '@/lib/validations/food';
import type { DryFoodEntry } from '@/types/food';
import { convertFoodWeight, formatWeight } from '@/lib/validations/pet';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getTodayDateString } from '@/lib/utils/date-formatting';

interface UseDryFoodFormOptions {
  dryFoodEntry?: DryFoodEntry;
  defaultValues?: Partial<DryFoodFormData>;
}

export function useDryFoodForm(options: UseDryFoodFormOptions = {}) {
  const { dryFoodEntry, defaultValues } = options;
  const { units } = usePreferencesContext();
  const bagWeightUnit = units?.bagWeightUnit ?? 'kg';

  const schema = dryFoodSchema;

  const getInitialValues = (): DryFoodFormData => {
    if (dryFoodEntry) {

      return {
        brandName: dryFoodEntry.brandName ?? undefined,
        productName: dryFoodEntry.productName ?? undefined,
        bagWeight: formatWeight(convertFoodWeight(parseFloat(dryFoodEntry.bagWeight), 'grams', bagWeightUnit)),
        bagWeightUnit,
        dailyAmount: formatWeight(parseFloat(dryFoodEntry.dailyAmount)),
        dateStarted: dryFoodEntry.dateStarted,
      };
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
    form.reset({
      brandName: newDryFoodEntry.brandName ?? undefined,
      productName: newDryFoodEntry.productName ?? undefined,
      bagWeight: formatWeight(convertFoodWeight(parseFloat(newDryFoodEntry.bagWeight), 'grams', bagWeightUnit)),
      bagWeightUnit,
      dailyAmount: formatWeight(parseFloat(newDryFoodEntry.dailyAmount)),
      dateStarted: newDryFoodEntry.dateStarted,
    });
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