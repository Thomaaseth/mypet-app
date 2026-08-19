import type { PetGender } from '@/lib/validations/pet';

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
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}
