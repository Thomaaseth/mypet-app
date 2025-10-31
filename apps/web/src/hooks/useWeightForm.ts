import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWeightEntrySchema, getTodayDateString, type WeightFormData } from '@/lib/validations/weight';
import type { WeightEntry } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';

interface UseWeightFormOptions {
  animalType: 'cat' | 'dog';
  weightUnit: WeightUnit;
  weightEntry?: WeightEntry;
  defaultValues?: Partial<WeightFormData>;
}

export function useWeightForm(options: UseWeightFormOptions) {
  const { animalType,weightUnit, weightEntry, defaultValues } = options;

  const schema = createWeightEntrySchema(weightUnit, animalType);

  const getInitialValues = (): WeightFormData => {
    if (weightEntry) {
      return {
        weight: weightEntry.weight,
        weightUnit: weightEntry.weightUnit,
        date: weightEntry.date,
      };
    }

    return {
      weight: '',
      weightUnit: weightUnit || 'kg',
      date: getTodayDateString(),
      ...defaultValues,
    };
  };

  const form = useForm<WeightFormData>({
    resolver: zodResolver(schema),
    defaultValues: getInitialValues(),
  });

  const resetWithWeightEntry = (newWeightEntry: WeightEntry) => {
    const formData: WeightFormData = {
      weight: newWeightEntry.weight,
      weightUnit: newWeightEntry.weightUnit,
      date: newWeightEntry.date,
    };
    
    form.reset(formData);
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