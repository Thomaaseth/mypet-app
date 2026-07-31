import { FormProvider } from 'react-hook-form';
import { useCreatePetForm } from '@/hooks/usePetForm';
import { PetFormFields } from './PetFormFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { ErrorText, HelperText } from '../ui/typography';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { useTranslation } from 'react-i18next';
import type { TranslationKey } from '@/i18n/translation-key';
import type { Pet } from '@/types/pet';
import type { PetFormData } from '@/lib/validations/pet';

interface PetCreateFormProps {
  onSubmit: (data: PetFormData) => Promise<Pet | null>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function PetCreateForm({ onSubmit, onCancel, isLoading = false }: PetCreateFormProps) {
  const { t } = useTranslation();
  const form = useCreatePetForm();
  const { units } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? 'kg';

  const onFormSubmit = form.handleSubmit(async (formData) => {
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  });

  const weightSlot = (
    <div className="space-y-2">
      <Label>{t('pets.form.weightLabel')}</Label>
      <div className="relative">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder={t('pets.form.weightPlaceholder')}
          className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...form.register('weight')}
          aria-invalid={!!form.formState.errors.weight}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
          {weightUnit}
        </span>
      </div>
      <input type="hidden" {...form.register('weightUnit')} />
      {form.formState.errors.weight && (
        <ErrorText>{t(form.formState.errors.weight.message as TranslationKey)}</ErrorText>
      )}
      <HelperText className="text-xs">
        {t('pets.form.weightHelper', { max: weightUnit === 'kg' ? '200kg' : '440lbs' })}
      </HelperText>
    </div>
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
        <PetFormFields weightSlot={weightSlot} />
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {t('common.actions.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t('pets.form.submitCreating') : t('pets.form.submitCreate')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}