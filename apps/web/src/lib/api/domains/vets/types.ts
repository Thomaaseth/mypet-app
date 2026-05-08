import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';

export interface VeterinarianApiResponse {
  veterinarian: Veterinarian;
}

export interface VeterinarianError {
  message: string;
  field?: keyof VeterinarianFormData;
  code: string;
}
