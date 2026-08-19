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
  // renew: seeds a NEW treatment from an existing one (create mode),
  // date blanked. Distinct from "treatment" which is an edit (update same row)
  renewFrom?: AntiParasiteTreatment;
  defaultValues?: Partial<AntiParasiteTreatmentFormFields>;
}

// single source of truth for mapping a stored treatment onto form fields
// reused by edit, renew and the imperative reset helper
function treatmentToFields(
  treatment: AntiParasiteTreatment,
): AntiParasiteTreatmentFormFields {
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

export function useAntiParasiteForm(options: UseAntiParasiteFormOptions = {}) {
  const { treatment, renewFrom, defaultValues } = options;

  const getInitialValues = (): AntiParasiteTreatmentFormFields => {
    if (treatment) {
      // Edit: pre-fill every field, re-encoding the stored unit+amount back
      // into the single dropdown string. Full edit — complete category set too.
      return treatmentToFields(treatment);
    }

    if (renewFrom) {
      // renew: same prefill as edit but date is cleared so the user must pick a new one
      return { ...treatmentToFields(renewFrom), dateAdministered: ''};
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
    form.reset(treatmentToFields(newTreatment));
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