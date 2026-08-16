import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  antiParasiteTreatmentFormFieldsSchema,
  encodeDurationOption,
  type AntiParasiteTreatmentFormFields,
} from '@/lib/validations/anti-parasite-treatment';
import type { AntiParasiteTreatment } from '@/types/anti-parasite-treatments';
import { getTodayDateString } from '@/lib/utils/date-formatting';

interface UseAntiParasiteFormOptions {
  treatment?: AntiParasiteTreatment;
  defaultValues?: Partial<AntiParasiteTreatmentFormFields>;
}

export function useAntiParasiteForm(options: UseAntiParasiteFormOptions = {}) {
  const { treatment, defaultValues } = options;

  const getInitialValues = (): AntiParasiteTreatmentFormFields => {
    if (treatment) {
      // Edit: pre-fill every field, re-encoding the stored unit+amount back
      // into the single dropdown string. Full edit — complete category set too.
      return {
        productName: treatment.productName,
        categories: treatment.categories,
        duration: encodeDurationOption({
          unit: treatment.durationUnit,
          amount: treatment.durationAmount,
        }),
        dateAdministered: treatment.dateAdministered,
      };
    }

    // Create: duration starts empty ("") so the user must consciously pick one;
    // submitting without a choice fails the form schema with "duration required".
    return {
      productName: '',
      categories: [],
      duration: '',
      dateAdministered: getTodayDateString(),
      ...defaultValues,
    };
  };

  const form = useForm<AntiParasiteTreatmentFormFields>({
    resolver: zodResolver(antiParasiteTreatmentFormFieldsSchema),
    defaultValues: getInitialValues(),
    shouldFocusError: false,
  });

  const resetWithTreatment = (newTreatment: AntiParasiteTreatment) => {
    form.reset({
      productName: newTreatment.productName,
      categories: newTreatment.categories,
      duration: encodeDurationOption({
        unit: newTreatment.durationUnit,
        amount: newTreatment.durationAmount,
      }),
      dateAdministered: newTreatment.dateAdministered,
    });
  };

  const resetToEmpty = () => {
    form.reset({
      productName: '',
      categories: [],
      duration: '',
      dateAdministered: getTodayDateString(),
      ...defaultValues,
    });
  };

  return {
    ...form,
    resetWithTreatment,
    resetToEmpty,
  };
}