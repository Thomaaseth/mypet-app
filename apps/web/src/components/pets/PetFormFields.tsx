import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '../ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { getTodayDateString } from '@/lib/utils/date-formatting';
import { ErrorText, HelperText } from '../ui/typography';
import { useTranslation } from 'react-i18next';
import { PET_GENDER_KEYS, ANIMAL_TYPE_KEYS } from '@/i18n/enum-keys';
import type { TranslationKey } from '@/i18n/translation-key';
import type { PetEditFormData } from '@/lib/validations/pet';
import type { ReactNode } from 'react';

interface PetFormFieldsProps {
  /** Rendered between Birth Date and Microchip: create passes the weight input,
   *  edit passes the weight-tracking message. Keeps field order identical. */
  weightSlot?: ReactNode;
}

export function PetFormFields({ weightSlot }: PetFormFieldsProps) {
  const { t } = useTranslation();
  // Reads the COMMON field shape. Only rendered inside Pet create/edit forms,
  // both of which contain every field below, so the context type is honored.
  const {
    register,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useFormContext<PetEditFormData>();

  return (
    <>
      {/* Pet Name */}
      <div className="space-y-2">
        <Label htmlFor="name">{t('pets.form.nameLabel')}*</Label>
        <Input
          id="name"
          placeholder={t('pets.form.namePlaceholder')}
          {...register('name')}
          aria-invalid={!!errors.name}
        />
        {errors.name && <ErrorText>{t(errors.name.message as TranslationKey)}</ErrorText>}
      </div>

       {/* Animal Type */}
      <div className="space-y-2">
        <Label>{t('pets.form.animalTypeLabel')}*</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['cat', 'dog'] as const).map((type) => (
            <Button
              key={type}
              type="button"
              variant={watch('animalType') === type ? 'default' : 'outline'}
              aria-pressed={watch('animalType') === type}
              onClick={() => {
                setValue('animalType', type, { shouldValidate: true });
                setValue('species', '');
              }}
            >
              {t(ANIMAL_TYPE_KEYS[type])}
            </Button>
          ))}
        </div>
        {errors.animalType && <ErrorText>{t(errors.animalType.message as TranslationKey)}</ErrorText>}
      </div>

      {/* Species/Breed */}
      <div className="space-y-2">
        <Label htmlFor="species">{t('pets.form.speciesLabel')}</Label>
        <Input
          id="species"
          placeholder={t('pets.form.speciesPlaceholder')}
          {...register('species')}
          aria-invalid={!!errors.species}
        />
        {errors.species && <ErrorText>{t(errors.species.message as TranslationKey)}</ErrorText>}
        <HelperText className="text-xs">{t('pets.form.speciesHelper')}</HelperText>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label>{t('pets.form.genderLabel')}*</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['male', 'female'] as const).map((g) => (
            <Button
              key={g}
              type="button"
              variant={watch('gender') === g ? 'default' : 'outline'}
              aria-pressed={watch('gender') === g}
              onClick={() => setValue('gender', g, { shouldValidate: true })}
            >
              {t(PET_GENDER_KEYS[g])}
            </Button>
          ))}
        </div>
        {errors.gender && <ErrorText>{t(errors.gender.message as TranslationKey)}</ErrorText>}
      </div>

      {/* Birth Date */}
      <div className="space-y-2">
        <Label htmlFor="birthDate">{t('pets.form.birthDateLabel')}</Label>
        <Controller
          name="birthDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="birthDate"
              value={field.value}
              onChange={field.onChange}
              maxDate={getTodayDateString()}
              aria-invalid={!!errors.birthDate}
            />
          )}
        />
        {errors.birthDate && <ErrorText>{t(errors.birthDate.message as TranslationKey)}</ErrorText>}
        <HelperText className="text-xs">{t('pets.form.birthDateHelper')}</HelperText>
      </div>

      {/* Weight (create) / tracking message (edit) — position preserved */}
      {weightSlot}

      {/* Microchip Number */}
      <div className="space-y-2">
        <Label htmlFor="microchipNumber">{t('pets.form.microchipLabel')}</Label>
        <Input
          id="microchipNumber"
          placeholder={t('pets.form.microchipPlaceholder')}
          {...register('microchipNumber')}
          aria-invalid={!!errors.microchipNumber}
        />
        {errors.microchipNumber && <ErrorText>{t(errors.microchipNumber.message as TranslationKey)}</ErrorText>}
        <HelperText className="text-xs">{t('pets.form.microchipHelper')}</HelperText>
      </div>

      {/* Is Neutered */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isNeutered"
          checked={watch('isNeutered')}
          onCheckedChange={(checked: boolean) => setValue('isNeutered', !!checked)}
        />
        <Label
          htmlFor="isNeutered"
          className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t('pets.card.spayedNeutered')}
        </Label>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t('pets.form.bioLabel')}</Label>
        <Textarea
          id="notes"
          placeholder={t('pets.form.bioPlaceholder')}
          rows={3}
          maxLength={200}
          {...register('notes')}
          aria-invalid={!!errors.notes}
        />
        {errors.notes && <ErrorText>{t(errors.notes.message as TranslationKey)}</ErrorText>}
        <HelperText className="text-xs">
          {t('pets.form.characterCount', { count: watch('notes')?.length ?? 0 })}
        </HelperText>
      </div>
    </>
  );
}