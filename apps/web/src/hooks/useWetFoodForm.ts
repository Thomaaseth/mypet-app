import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wetFoodSchema, type WetFoodFormData } from '@/lib/validations/food';
import type { WetFoodEntry } from '@/types/food';
import { convertFoodWeight, formatWeight } from '@/lib/validations/pet';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getTodayDateString } from '@/lib/utils/date-formatting';

function wetFoodEntryToFormValues(
  entry: WetFoodEntry,
  wetFoodUnit: WetFoodFormData['wetFoodUnit'],
): WetFoodFormData {
  return {
    brandName: entry.brandName ?? undefined,
    productName: entry.productName ?? undefined,
    numberOfUnits: entry.numberOfUnits.toString(),
    weightPerUnit: formatWeight(convertFoodWeight(parseFloat(entry.weightPerUnit), 'grams', wetFoodUnit)),
    wetFoodUnit,
    dailyAmount: formatWeight(convertFoodWeight(parseFloat(entry.dailyAmount), 'grams', wetFoodUnit)),
    dateStarted: entry.dateStarted,
  };
}

interface UseWetFoodFormOptions {
  wetFoodEntry?: WetFoodEntry;
  renewFrom?: WetFoodEntry;
  defaultValues?: Partial<WetFoodFormData>;
}

export function useWetFoodForm(options: UseWetFoodFormOptions = {}) {
  const { wetFoodEntry, renewFrom, defaultValues } = options;
  const { units } = usePreferencesContext();
  const wetFoodUnit = units?.wetFoodUnit ?? 'grams';

  const schema = wetFoodSchema;

  const getInitialValues = (): WetFoodFormData => {
    if (wetFoodEntry) {
      return wetFoodEntryToFormValues(wetFoodEntry, wetFoodUnit);
    }
    if (renewFrom) {
      return { ...wetFoodEntryToFormValues(renewFrom, wetFoodUnit), dateStarted: '' };
    }

    return {
      numberOfUnits: '',
      weightPerUnit: '',
      wetFoodUnit,
      dailyAmount: '',
      dateStarted: getTodayDateString(),
      ...defaultValues,
    };
  };

  const form = useForm<WetFoodFormData>({
    resolver: zodResolver(schema),
    defaultValues: getInitialValues(),
    shouldFocusError: false,
  });

  const resetWithWetFoodEntry = (newWetFoodEntry: WetFoodEntry) => {
    form.reset(wetFoodEntryToFormValues(newWetFoodEntry, wetFoodUnit));
  };

  const resetToEmpty = () => {
    form.reset({
      numberOfUnits: '',
      weightPerUnit: '',
      wetFoodUnit,
      dailyAmount: '',
      dateStarted: getTodayDateString(),
      ...defaultValues,
    });
  };

  return {
    ...form,
    resetWithWetFoodEntry,
    resetToEmpty,
  };
}