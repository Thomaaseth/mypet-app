import type { VeterinarianFormData } from '@/types/veterinarian';

export interface VeterinarianError {
  message: string;
  field?: keyof VeterinarianFormData;
  code: string;
}
