import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { petFormSchema, petEditFormSchema, type PetFormData, type PetEditFormData } from '@/lib/validations/pet';
import type { Pet } from '@/types/pet';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';

interface UseCreatePetFormOptions {
  defaultValues?: Partial<PetFormData>;
}

export function useCreatePetForm(options: UseCreatePetFormOptions = {}) {
  const { defaultValues } = options;
  const { units } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? 'kg';

  return useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: '',
      species: '',
      birthDate: '',
      weight: '',
      weightUnit,
      isNeutered: false,
      microchipNumber: '',
      notes: '',
      ...defaultValues,
    },
    shouldFocusError: false,
  });
}

export function useEditPetForm(pet: Pet) {
  return useForm<PetEditFormData>({
    resolver: zodResolver(petEditFormSchema),
    defaultValues: {
      name: pet.name,
      animalType: pet.animalType,
      species: pet.species || '',
      gender: pet.gender,
      birthDate: pet.birthDate || '',
      isNeutered: pet.isNeutered,
      microchipNumber: pet.microchipNumber || '',
      notes: pet.notes || '',
    },
    shouldFocusError: false,
  });
}