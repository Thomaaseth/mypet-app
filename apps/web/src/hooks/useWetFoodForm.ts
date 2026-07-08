import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wetFoodSchema, type WetFoodFormData } from '@/lib/validations/food';
import type { WetFoodEntry } from '@/types/food';
import { convertFoodWeight, formatWeight } from '@/lib/validations/pet';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getTodayDateString } from '@/lib/utils/date-formatting';

interface UseWetFoodFormOptions {
  wetFoodEntry?: WetFoodEntry;
  defaultValues?: Partial<WetFoodFormData>;
}

export function useWetFoodForm(options: UseWetFoodFormOptions = {}) {
  const { wetFoodEntry, defaultValues } = options;
  const { units } = usePreferencesContext();
  const wetFoodUnit = units?.wetFoodUnit ?? 'grams';

  const schema = wetFoodSchema;

  const getInitialValues = (): WetFoodFormData => {
    if (wetFoodEntry) {
      // weightPerUnit and dailyAmount are both stored in grams
      // both need converting to display unit for editing
      return {
        brandName: wetFoodEntry.brandName ?? undefined,
        productName: wetFoodEntry.productName ?? undefined,
        numberOfUnits: wetFoodEntry.numberOfUnits.toString(),
        weightPerUnit: formatWeight(convertFoodWeight(parseFloat(wetFoodEntry.weightPerUnit), 'grams', wetFoodUnit)),
        wetFoodUnit,
        dailyAmount: formatWeight(convertFoodWeight(parseFloat(wetFoodEntry.dailyAmount), 'grams', wetFoodUnit)),
        dateStarted: wetFoodEntry.dateStarted,
      };
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
    form.reset({
      brandName: newWetFoodEntry.brandName ?? undefined,
      productName: newWetFoodEntry.productName ?? undefined,
      numberOfUnits: newWetFoodEntry.numberOfUnits.toString(),
      weightPerUnit: formatWeight(convertFoodWeight(parseFloat(newWetFoodEntry.weightPerUnit), 'grams', wetFoodUnit)),
      wetFoodUnit,
      dailyAmount: formatWeight(convertFoodWeight(parseFloat(newWetFoodEntry.dailyAmount), 'grams', wetFoodUnit)),
      dateStarted: newWetFoodEntry.dateStarted,
    });
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