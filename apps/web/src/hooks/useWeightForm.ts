import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWeightEntrySchema, getTodayDateString, type WeightFormData } from '@/lib/validations/weight';
import type { WeightEntry } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';

interface UseWeightFormOptions {
  weightUnit: WeightUnit;
  weightEntry?: WeightEntry; // For editing existing entries
  defaultValues?: Partial<WeightFormData>;
}

export function useWeightForm(options: UseWeightFormOptions) {
  const { weightUnit, weightEntry, defaultValues } = options;

  // Create schema with unit-specific validation
  const schema = createWeightEntrySchema(weightUnit);

  // Convert WeightEntry data to form data if editing
  const getInitialValues = (): WeightFormData => {
    if (weightEntry) {
      return {
        weight: weightEntry.weight,
        date: weightEntry.date,
      };
    }

    return {
      weight: '',
      date: getTodayDateString(),
      ...defaultValues,
    };
  };

  const form = useForm<WeightFormData>({
    resolver: zodResolver(schema),
    defaultValues: getInitialValues(),
  });

  // Reset form with new weight entry (useful for editing)
  const resetWithWeightEntry = (newWeightEntry: WeightEntry) => {
    const formData: WeightFormData = {
      weight: newWeightEntry.weight,
      date: newWeightEntry.date,
    };
    
    form.reset(formData);
  };

  // Reset to empty form
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