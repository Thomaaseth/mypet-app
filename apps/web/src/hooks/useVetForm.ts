import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { baseVeterinarianFormSchema, type VeterinarianFormData } from '@/lib/validations/veterinarians';
import type { Veterinarian } from '@/types/veterinarian';

interface UseVetFormOptions {
  defaultValues?: Partial<VeterinarianFormData>;
  vet?: Veterinarian; // For editing existing vets
}

export function useVetForm(options: UseVetFormOptions = {}) {
  const { defaultValues, vet } = options;

  // Convert Veterinarian data to form data if editing
  const getInitialValues = (): VeterinarianFormData => {
    if (vet) {
      return {
        vetName: vet.vetName,
        clinicName: vet.clinicName || '',
        phone: vet.phone,
        email: vet.email || '',
        website: vet.website || '',
        addressLine1: vet.addressLine1,
        addressLine2: vet.addressLine2 || '',
        city: vet.city,
        zipCode: vet.zipCode,
        notes: vet.notes || '',
      };
    }

    return {
      vetName: '',
      clinicName: '',
      phone: '',
      email: '',
      website: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      zipCode: '',
      notes: '',
      ...defaultValues,
    };
  };

  const form = useForm({
    resolver: zodResolver(baseVeterinarianFormSchema),
    defaultValues: getInitialValues(),
  });

  // Reset form with new vet data (useful for switching between vets)
  const resetWithVet = (newVet: Veterinarian) => {
    const formData: VeterinarianFormData = {
      vetName: newVet.vetName,
      clinicName: newVet.clinicName || '',
      phone: newVet.phone,
      email: newVet.email || '',
      website: newVet.website || '',
      addressLine1: newVet.addressLine1,
      addressLine2: newVet.addressLine2 || '',
      city: newVet.city,
      zipCode: newVet.zipCode,
      notes: newVet.notes || '',
    };
    
    form.reset(formData);
  };

  // Reset to empty form
  const resetToEmpty = () => {
    form.reset(getInitialValues());
  };

  return {
    ...form,
    resetWithVet,
    resetToEmpty,
  };
}