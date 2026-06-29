export type PetGender = 'male' | 'female' | 'unknown';
export type WeightUnit = 'kg' | 'lbs';

export interface Pet {
  id: string;
  userId: string;
  name: string;
  animalType: 'cat' | 'dog';
  species: string | null;
  gender: PetGender;
  birthDate: string | null; // ISO date string
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
  animalType: 'cat' | 'dog';
  species?: string; // Free text field
  gender: PetGender;
  birthDate: string; // HTML date input format: YYYY-MM-DD
  weight: string; // String for form input (the weight value)
  weightUnit: WeightUnit; // Unit selection
  isNeutered: boolean;
  microchipNumber: string;
  notes: string;
}
