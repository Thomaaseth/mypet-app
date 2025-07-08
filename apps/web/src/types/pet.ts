export type PetGender = 'male' | 'female' | 'unknown';
export type WeightUnit = 'kg' | 'lbs';

export interface Pet {
  id: string;
  userId: string;
  name: string;
  species: string | null; // Optional
  gender: PetGender;
  birthDate: string | null; // ISO date string
  weight: string | null; // Decimal as string (the actual weight value)
  weightUnit: WeightUnit; // Unit: kg or lbs
  isNeutered: boolean;
  microchipNumber: string | null;
  imageUrl: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form data types
export interface PetFormData {
  name: string;
  species: string; // Free text field
  gender: PetGender;
  birthDate: string; // HTML date input format: YYYY-MM-DD
  weight: string; // String for form input (the weight value)
  weightUnit: WeightUnit; // Unit selection
  isNeutered: boolean;
  microchipNumber: string;
  notes: string;
}

// API response types
export interface PetsApiResponse {
  pets: Pet[];
  total: number;
}

export interface PetApiResponse {
  pet: Pet;
}

// Error types
export interface PetError {
  message: string;
  field?: keyof PetFormData;
  code?: string;
}
