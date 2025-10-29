import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { petFormSchema, type PetFormData } from '@/lib/validations/pet';
import type { Pet } from '@/types/pet';

interface UsePetFormOptions {
  defaultValues?: Partial<PetFormData>;
  pet?: Pet; // For editing existing pets
}

export function usePetForm(options: UsePetFormOptions = {}) {
  const { defaultValues, pet } = options;

  // Convert Pet data to form data if editing
  const getInitialValues = (): PetFormData => {
    if (pet) {
      return {
        name: pet.name,
        animalType: pet.animalType,
        species: pet.species || '',
        gender: pet.gender,
        birthDate: pet.birthDate || '',
        weight: '',
        weightUnit: 'kg',
        isNeutered: pet.isNeutered,
        microchipNumber: pet.microchipNumber || '',
        notes: pet.notes || '',
      };
    }

    return {
      name: '',
      animalType: 'cat',
      species: '',
      gender: 'unknown',
      birthDate: '',
      weight: '',
      weightUnit: 'kg',
      isNeutered: false,
      microchipNumber: '',
      notes: '',
      ...defaultValues,
    };
  };

  const form = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: getInitialValues(),
  });

  // Reset form with new data (useful for switching between pets)
  const resetWithPet = (newPet: Pet) => {
    const formData: PetFormData = {
      name: newPet.name,
      animalType: newPet.animalType,
      species: newPet.species || '',
      gender: newPet.gender,
      birthDate: newPet.birthDate || '',
      weight: '',
      weightUnit: 'kg',
      isNeutered: newPet.isNeutered,
      microchipNumber: newPet.microchipNumber || '',
      notes: newPet.notes || '',
    };
    
    form.reset(formData);
  };

  // Reset to empty form
  const resetToEmpty = () => {
    form.reset(getInitialValues());
  };

  return {
    ...form,
    resetWithPet,
    resetToEmpty,
  };
}