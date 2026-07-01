import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWeightEntrySchema, getTodayDateString, type WeightFormData } from '@/lib/validations/weight';
import type { WeightEntry } from '@/types/weights';
import { convertWeight } from '@/lib/validations/pet';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';

interface UseWeightFormOptions {
  animalType: 'cat' | 'dog';
  weightEntry?: WeightEntry;
  defaultValues?: Partial<WeightFormData>;
}

export function useWeightForm(options: UseWeightFormOptions) {
  const { animalType, weightEntry, defaultValues } = options;
  const { units } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? 'kg';

  const schema = createWeightEntrySchema(weightUnit, animalType);

  const getInitialValues = (): WeightFormData => {
    if (weightEntry) {
      // Convert stored kg value to display unit for editing
      const displayWeight = convertWeight(parseFloat(weightEntry.weight), 'kg', weightUnit);
      return {
        weight: parseFloat(displayWeight.toFixed(2)).toString(),
        weightUnit,
        date: weightEntry.date,
      };
    }

    return {
      weight: '',
      weightUnit,
      date: getTodayDateString(),
      ...defaultValues,
    };
  };

  const form = useForm<WeightFormData>({
    resolver: zodResolver(schema),
    defaultValues: getInitialValues(),
    shouldFocusError: false,
  });

  const resetWithWeightEntry = (newWeightEntry: WeightEntry) => {
    const displayWeight = convertWeight(parseFloat(newWeightEntry.weight), 'kg', weightUnit);
    form.reset({
      weight: parseFloat(displayWeight.toFixed(2)).toString(),
      weightUnit,
      date: newWeightEntry.date,
    });
  };

  const resetToEmpty = () => {
    form.reset({
      weight: '',
      date: getTodayDateString(),
      ...defaultValues,
    });
  };

  return {
    ...form,
    resetWithWeightEntry,
    resetToEmpty,
  };
}