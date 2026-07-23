import { Controller } from 'react-hook-form';
import { z } from 'zod'
import { usePetForm } from '@/hooks/usePetForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Pet, PetFormData } from '@/types/pet';
import { petFormSchema } from '@/lib/validations/pet';
import { PetImageUpload } from '@/components/pets/PetImageUpload';
import { ErrorText, HelperText } from '../ui/typography';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { DatePicker } from '@/components/ui/date-picker';
import { getTodayDateString } from '@/lib/utils/date-formatting';
import { useTranslation } from 'react-i18next';
import { PET_GENDER_KEYS, ANIMAL_TYPE_KEYS } from '@/i18n/enum-keys';

interface PetFormProps {
  pet?: Pet; // if provided, we're editing
  signedUrl?: string | null; // only in edit mode
  onSubmit: (data: PetFormData) => Promise<Pet | null>; // allow return type to match hook
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function PetForm({ 
  pet, 
  signedUrl = null,
  onSubmit, 
  onCancel, 
  isLoading = false,
  error 
}: PetFormProps) {
  const { t } = useTranslation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
    control,
  } = usePetForm({ pet });

  const isEditing = !!pet;

  const { units } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? 'kg';

  // Handle form submission
 const onFormSubmit = async (formData: z.infer<typeof petFormSchema>) => {
  try {
    const transformedData: PetFormData = {
      name: formData.name,
      animalType: formData.animalType,
      species: formData.species ?? '',
      gender: formData.gender,
      birthDate: formData.birthDate ?? '',
      weight: formData.weight ?? '',
      weightUnit: formData.weightUnit,
      isNeutered: formData.isNeutered,
      microchipNumber: formData.microchipNumber ?? '',
      notes: formData.notes ?? '',
    };
    
    await onSubmit(transformedData);
  } catch (err) {
    console.error('Form submission error:', err);
  }
};

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>

      {/* Pet Photo — edit mode only, requires existing petId */}
      {isEditing && (
        <div className="space-y-2">
          <Label>{t('pets.form.petPhoto')}</Label>
          <PetImageUpload
            petId={pet.id}
            petName={pet.name}
            signedUrl={signedUrl}
          />
        </div>
      )}

      {/* Pet Name */}
      <div className="space-y-2">
      <Label htmlFor="name">{t('pets.form.nameLabel')}</Label>
        <Input
          id="name"
          placeholder={t('pets.form.namePlaceholder')}
          {...register('name')}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <ErrorText>{errors.name.message}</ErrorText>
        )}
      </div>

      {/* Animal Type */}
        <div className="space-y-2">
        <Label htmlFor="animalType">{t('pets.form.animalTypeLabel')}</Label>
        <Select 
            value={watch('animalType')} 
            onValueChange={(value: 'cat' | 'dog') => {
            setValue('animalType', value);
            // Clear species when animal type changes
            setValue('species', '');
            }}
        >
          <SelectTrigger aria-invalid={!!errors.animalType}>
            <SelectValue placeholder={t('pets.form.animalTypePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cat">{t(ANIMAL_TYPE_KEYS.cat)}</SelectItem>
            <SelectItem value="dog">{t(ANIMAL_TYPE_KEYS.dog)}</SelectItem>
          </SelectContent>
        </Select>
        {errors.animalType && (
            <ErrorText>{errors.animalType.message}</ErrorText>
        )}
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
        {errors.species && (
          <ErrorText>{errors.species.message}</ErrorText>
        )}
        <HelperText className="text-xs">
          {t('pets.form.speciesHelper')}
        </HelperText>
      </div>

      {/* Gender */}
      <div className="space-y-2">
      <Label htmlFor="sex">{t('pets.form.genderLabel')}</Label>
        <Select 
          value={watch('gender')} 
          onValueChange={(value: 'male' | 'female' | 'unknown') => setValue('gender', value)}
        >
          <SelectTrigger aria-invalid={!!errors.gender}>
            <SelectValue placeholder={t('pets.form.genderPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">{t(PET_GENDER_KEYS.male)}</SelectItem>
            <SelectItem value="female">{t(PET_GENDER_KEYS.female)}</SelectItem>
            <SelectItem value="unknown">{t(PET_GENDER_KEYS.unknown)}</SelectItem>
          </SelectContent>
        </Select>
        {errors.gender && (
          <ErrorText>{errors.gender.message}</ErrorText>
        )}
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
        {errors.birthDate && (
          <ErrorText>{errors.birthDate.message}</ErrorText>
        )}
        <HelperText className="text-xs">
        {t('pets.form.birthDateHelper')}
        </HelperText>
      </div>

      {/* Weight - Only show in CREATE mode */}
      {!isEditing && (
      <div className="space-y-2">
        <Label>{t('pets.form.weightLabel')}</Label>
        <div className="relative">
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder={t('pets.form.weightPlaceholder')}
            className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"            {...register('weight')}
            aria-invalid={!!errors.weight}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
            {weightUnit}
          </span>
        </div>
        <input type="hidden" {...register('weightUnit')} />
        {errors.weight && <ErrorText>{errors.weight.message}</ErrorText>}
        <HelperText className="text-xs">
        {t('pets.form.weightHelper', { max: weightUnit === 'kg' ? '200kg' : '440lbs' })}
        </HelperText>
      </div>
    )}

      {/* Message for EDIT mode */}
      {isEditing && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-md border border-muted">
        <HelperText className="text-xs">
          <strong>{t('pets.form.weightTrackingTitle')}</strong> {t('pets.form.weightTrackingText')}
        </HelperText>
        </div>
      )}

      {/* Microchip Number */}
      <div className="space-y-2">
      <Label htmlFor="microchipNumber">{t('pets.form.microchipLabel')}</Label>
        <Input
          id="microchipNumber"
          placeholder={t('pets.form.microchipPlaceholder')}
          {...register('microchipNumber')}
          aria-invalid={!!errors.microchipNumber}
        />
        {errors.microchipNumber && (
          <ErrorText>{errors.microchipNumber.message}</ErrorText>
        )}
        <HelperText className="text-xs">
          {t('pets.form.microchipHelper')}
        </HelperText>
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
        {errors.notes && (
          <ErrorText>{errors.notes.message}</ErrorText>
        )}
        <HelperText className="text-xs">
          {t('pets.form.characterCount', { count: watch('notes')?.length ?? 0 })}
        </HelperText>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('common.actions.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading 
            ? (isEditing ? t('pets.form.submitUpdating') : t('pets.form.submitCreating'))
            : (isEditing ? t('pets.form.submitUpdate') : t('pets.form.submitCreate'))
          }
        </Button>
      </div>
    </form>
  );
}