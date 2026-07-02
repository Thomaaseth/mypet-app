import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { petFormSchema, type PetFormData } from '@/lib/validations/pet';
import type { Pet } from '@/types/pet';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';

interface UsePetFormOptions {
  defaultValues?: Partial<PetFormData>;
  pet?: Pet; // For editing existing pets
}

export function usePetForm(options: UsePetFormOptions = {}) {
  const { defaultValues, pet } = options;
  const { units } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? 'kg';

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
        weightUnit,
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
      weightUnit,
      isNeutered: false,
      microchipNumber: '',
      notes: '',
      ...defaultValues,
    };
  };

  const form = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: getInitialValues(),
    shouldFocusError: false,
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
      weightUnit,
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