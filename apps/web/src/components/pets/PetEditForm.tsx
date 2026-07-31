import { FormProvider } from 'react-hook-form';
import { useEditPetForm } from '@/hooks/usePetForm';
import { PetFormFields } from './PetFormFields';
import { PetImageUpload } from '@/components/pets/PetImageUpload';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { HelperText } from '../ui/typography';
import { useTranslation } from 'react-i18next';
import type { Pet } from '@/types/pet';
import type { PetEditFormData } from '@/lib/validations/pet';

interface PetEditFormProps {
  pet: Pet;
  signedUrl?: string | null;
  onSubmit: (data: PetEditFormData) => Promise<Pet | null>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function PetEditForm({ pet, signedUrl = null, onSubmit, onCancel, isLoading = false }: PetEditFormProps) {
  const { t } = useTranslation();
  const form = useEditPetForm(pet);

  // formData is PetEditFormData (no weight/weightUnit by construction), so it
  // flows straight to onSubmit — no reshaping, no stripping.
  const onFormSubmit = form.handleSubmit(async (formData) => {
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  });

  const weightSlot = (
    <div className="space-y-2 p-4 bg-muted/50 rounded-md border border-muted">
      <HelperText className="text-xs">
        <strong>{t('pets.form.weightTrackingTitle')}</strong> {t('pets.form.weightTrackingText')}
      </HelperText>
    </div>
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
        {/* Pet Photo — edit only */}
        <div className="space-y-2">
          <Label>{t('pets.form.petPhoto')}</Label>
          <PetImageUpload petId={pet.id} petName={pet.name} signedUrl={signedUrl} />
        </div>

        <PetFormFields weightSlot={weightSlot} />

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {t('common.actions.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t('pets.form.submitUpdating') : t('pets.form.submitUpdate')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}