import type { WeightFormData } from '@/types/weights';

export interface WeightError {
  message: string;
  field?: keyof WeightFormData;
  code: string;
}