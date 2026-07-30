import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { petNoteFormSchema, type PetNoteFormData } from '@/lib/validations/pet-notes';

interface UsePetNoteFormOptions {
  defaultValues?: Partial<PetNoteFormData>;
}

export function usePetNoteForm(options: UsePetNoteFormOptions = {}) {
  const { defaultValues } = options;

  const form = useForm<PetNoteFormData>({
    resolver: zodResolver(petNoteFormSchema),
    defaultValues: { content: '', ...defaultValues },
    shouldFocusError: false,
  });

  const resetToEmpty = () => form.reset({ content: '' });

  return { ...form, resetToEmpty };
}