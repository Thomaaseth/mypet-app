import type { AntiParasiteTreatmentFormData } from '@/lib/validations/anti-parasite-treatment';

// Shape of a mapped domain error. `field` is keyed to the
// form data so the caller can attach the message to the right input.
export interface AntiParasiteTreatmentError {
  message: string;
  field?: keyof AntiParasiteTreatmentFormData;
  code: string;
}