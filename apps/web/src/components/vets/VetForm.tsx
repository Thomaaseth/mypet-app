import { z } from 'zod'
import { useState, useEffect } from 'react';
import { useVetForm } from '@/hooks/useVetForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { usePets } from '@/queries/pets';
import { useVetPets } from '@/queries/vets';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';
import { baseVeterinarianFormSchema } from '@/lib/validations/veterinarians';
import { SectionTitle, MutedText, ErrorText, HelperText } from '../ui/typography';
import { useTranslation } from 'react-i18next';
import type { TranslationKey } from '@/i18n/translation-key';

interface VetFormProps {
  vet?: Veterinarian;
  onSubmit: (
    data: VeterinarianFormData,
    petIds?: string[],
  ) => Promise<Veterinarian | null>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function VetForm({
  vet,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}: VetFormProps) {
  const { t } = useTranslation();
  const isEditing = !!vet;

  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);

  // Fetch pets for assignment
  const { data: pets } = usePets();

  // If editing, fetch current assignments
  const { data: currentAssignments } = useVetPets(vet?.id || '');

  // Load current assignments when editing
  useEffect(() => {
    if (vet && currentAssignments) {
      setSelectedPetIds(currentAssignments.map(a => a.petId));
    }
  }, [vet, currentAssignments]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useVetForm({ vet });

  const onFormSubmit = async (formData: z.infer<typeof baseVeterinarianFormSchema>) => {
    try {
      const transformedData: VeterinarianFormData = {
        vetName: formData.vetName,
        clinicName: formData.clinicName ?? '',
        phone: formData.phone,
        email: formData.email ?? '',
        website: formData.website ?? '',
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 ?? '',
        city: formData.city,
        zipCode: formData.zipCode,
        notes: formData.notes ?? '',
      };
      
    // UNASSIGN BUG FIX (can't unassign last pet to vet):
    //   undefined = assignment section wasn't rendered (user has no pets) → parent skips assignment logic
    //   []        = user deliberately deselected all pets → parent must unassign them
    // Collapsing [] into undefined previously made it impossible to unassign the last pet.
    const petIdsToSubmit: string[] | undefined =
      pets && pets.length > 0 ? selectedPetIds : undefined;

    await onSubmit(transformedData, petIdsToSubmit);

    } catch (err) {
      console.error('Form submission error:', err);
    }
  };


  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="vetName">{t('vets.form.vetNameLabel')}</Label>
        <Input
          id="vetName"
          placeholder={t('vets.form.vetNamePlaceholder')}
          {...register('vetName')}
          aria-invalid={!!errors.vetName}
        />
        {errors.vetName && <ErrorText>{t(errors.vetName.message as TranslationKey)}</ErrorText>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clinicName">{t('vets.form.clinicNameLabel')}</Label>
        <Input
          id="clinicName"
          placeholder={t('vets.form.clinicNamePlaceholder')}
          {...register('clinicName')}
          aria-invalid={!!errors.clinicName}
        />
          {errors.clinicName && <ErrorText>{t(errors.clinicName.message as TranslationKey)}</ErrorText>} 
        <HelperText className="text-xs">
          {t('vets.form.clinicNameHelper')}
        </HelperText>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t('vets.form.phoneLabel')}</Label>
        <Input
          id="phone"
          type="tel"
          placeholder={t('vets.form.phonePlaceholder')}
          {...register('phone')}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && <ErrorText>{t(errors.phone.message as TranslationKey)}</ErrorText>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('vets.form.emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          placeholder="contact@pettr.life"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && <ErrorText>{t(errors.email.message as TranslationKey)}</ErrorText>}
        <HelperText className="text-xs">
          {t('vets.form.optionalHelper')}
        </HelperText>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">{t('vets.form.websiteLabel')}</Label>
        <Input
          id="website"
          type="text"
          placeholder="www.pettr.life"
          {...register('website')}
          aria-invalid={!!errors.website}
        />
        {errors.website && <ErrorText>{t(errors.website.message as TranslationKey)}</ErrorText>}
        <HelperText className="text-xs">
          {t('vets.form.optionalHelper')}
        </HelperText>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine1">{t('vets.form.addressLabel')}</Label>
        <Input
          id="addressLine1"
          placeholder={t('vets.form.addressPlaceholder')}
          {...register('addressLine1')}
          aria-invalid={!!errors.addressLine1}
        />
        {errors.addressLine1 && <ErrorText>{t(errors.addressLine1.message as TranslationKey)}</ErrorText>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine2">{t('vets.form.addressLine2Label')}</Label>
        <Input
          id="addressLine2"
          placeholder={t('vets.form.addressLine2Placeholder')}
          {...register('addressLine2')}
          aria-invalid={!!errors.addressLine2}
        />
          {errors.addressLine2 && <ErrorText>{t(errors.addressLine2.message as TranslationKey)}</ErrorText>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">{t('vets.form.cityLabel')}</Label>
          <Input
            id="city"
            placeholder={t('vets.form.cityPlaceholder')}
            {...register('city')}
            aria-invalid={!!errors.city}
          />
        {errors.city && <ErrorText>{t(errors.city.message as TranslationKey)}</ErrorText>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">{t('vets.form.zipCodeLabel')}</Label>
          <Input
            id="zipCode"
            placeholder={t('vets.form.zipCodePlaceholder')}
            {...register('zipCode')}
            aria-invalid={!!errors.zipCode}
          />
        {errors.zipCode && <ErrorText>{t(errors.zipCode.message as TranslationKey)}</ErrorText>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('vets.form.notesLabel')}</Label>
        <Textarea
          id="notes"
          placeholder={t('vets.form.notesPlaceholder')}
          rows={3}
          {...register('notes')}
          aria-invalid={!!errors.notes}
          className="[word-break:break-word]"
          maxLength={100}
        />
        {errors.notes && <ErrorText>{t(errors.notes.message as TranslationKey)}</ErrorText>}
        <HelperText className="text-xs">
          {t('vets.form.notesCharCount', { count: watch('notes')?.length || 0 })}
        </HelperText>
      </div>

      {/* Pet Assignment - show in CREATE and EDIT mode and if user has pets */}
      {pets && pets.length > 0 && (
        <div className="space-y-4 p-4 border rounded-md bg-muted/50">
          <div className="space-y-2">
          <SectionTitle>{t('vets.form.assignToPetsTitle')}</SectionTitle>
          <MutedText>{t('vets.form.assignToPetsDescription')}</MutedText>
          </div>

          <div className="space-y-2">
            {pets.map((pet) => (
              <div key={pet.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                <Checkbox
                  id={`pet-${pet.id}`}
                  checked={selectedPetIds.includes(pet.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPetIds([...selectedPetIds, pet.id]);
                    } else {
                      setSelectedPetIds(selectedPetIds.filter((id) => id !== pet.id));
                    }
                  }}
                />
                <Label
                  htmlFor={`pet-${pet.id}`}
                  className="cursor-pointer font-normal flex-1"
                >
                  {pet.name}
                </Label>
              </div>
            ))}
          </div>

                  
        {selectedPetIds.length === 0 && (
            <HelperText className="text-xs">
              {t('vets.form.assignLaterHelper')}
            </HelperText>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('common.actions.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading
            ? isEditing
              ? t('vets.form.submitUpdating')
              : t('vets.form.submitCreating')
            : isEditing
            ? t('vets.form.submitUpdate')
            : t('vets.form.submitCreate')}
        </Button>
      </div>
    </form>
  );
}