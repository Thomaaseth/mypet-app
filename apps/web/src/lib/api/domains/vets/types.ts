import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';

export interface VeterinariansApiResponse {
  veterinarians: Veterinarian[];
  total: number;
}

export interface VeterinarianApiResponse {
  veterinarian: Veterinarian;
}

export interface VeterinarianError {
  message: string;
  field?: keyof VeterinarianFormData;
  code: string;
}
