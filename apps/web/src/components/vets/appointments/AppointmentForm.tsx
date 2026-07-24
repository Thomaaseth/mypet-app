import { z } from 'zod';
import { useEffect } from 'react';
import { useAppointmentForm } from '@/hooks/useAppointmentForm';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { AppointmentWithRelations, AppointmentFormData, AppointmentType } from '@/types/appointments';
import { appointmentFormSchema, appointmentTypes, generateTimeOptions, isUpcomingAppointment } from '@/lib/validations/appointments';
import { usePets } from '@/queries/pets';
import { useVeterinarians } from '@/queries/vets';
import { usePetVets } from '@/queries/vets';
import { useLastVetForPet } from '@/queries/appointments';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getFallbackDateTimeLocale } from '@/lib/utils/locale';
import { formatTimeForDisplay } from '@/lib/validations/appointments';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@/components/ui/date-picker';
import { MutedText, ErrorText, HelperText } from '@/components/ui/typography';
import { useTranslation } from 'react-i18next';
import { APPOINTMENT_TYPE_KEYS } from '@/i18n/enum-keys';

interface AppointmentFormProps {
  appointment?: AppointmentWithRelations;
  prefilledPetId?: string; // For "Book Appointment" from pet profile NOT USED YET
  onSubmit: (data: AppointmentFormData) => Promise<AppointmentWithRelations | null>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function AppointmentForm({
  appointment,
  prefilledPetId,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}: AppointmentFormProps) {
  const { t } = useTranslation();
  const isEditing = !!appointment;
  const isPastAppointment = appointment ? !isUpcomingAppointment(appointment.appointmentDate) : false;

  // Check if appointment time has passed (show Visit Summary field on same day)
  const hasAppointmentTimePassed = (() => {
    if (!appointment) return false;
    const now = new Date();
    const apptDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    return now > apptDateTime;
  })();
  
  // Fetch pets and vets
  const { data: pets } = usePets();
  const { data: vets } = useVeterinarians();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useAppointmentForm({ appointment, defaultValues: prefilledPetId ? { petId: prefilledPetId } : undefined });

  const selectedPetId = watch('petId');
  const selectedVetId = watch('veterinarianId');
  
  const { dateTimeLocale } = usePreferencesContext();
  const displayLocale = dateTimeLocale ?? getFallbackDateTimeLocale();

  // Fetch vets assigned to selected pet
  const { data: availableVetsData } = usePetVets(selectedPetId || '');

  const { data: lastVetId, isLoading: isLoadingLastVet } = useLastVetForPet(selectedPetId || '', {
    enabled: !!selectedPetId && !isEditing
  });

  useEffect(() => {
    if (!selectedPetId || !availableVetsData) {
      return;
    }

    // Pre-fill vet if not editing and last vet exists
    if (!isEditing && lastVetId && availableVetsData.some(v => v.id === lastVetId)) {
      setValue('veterinarianId', lastVetId);
    }
  }, [selectedPetId, availableVetsData, lastVetId, isEditing, setValue]);

  const timeOptions = generateTimeOptions();

  const onFormSubmit = async (formData: z.infer<typeof appointmentFormSchema>) => {
    try {
      const transformedData: AppointmentFormData = {
        petId: formData.petId,
        veterinarianId: formData.veterinarianId,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        appointmentType: formData.appointmentType,
        reasonForVisit: formData.reasonForVisit ?? '',
        visitNotes: formData.visitNotes ?? '',
      };

      await onSubmit(transformedData);
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

      {/* Pet Selection */}
      <div className="space-y-2">
        <Label htmlFor="petId">{t('appointments.form.petLabel')}</Label>
        <Select
          value={selectedPetId}
          onValueChange={(value) => {
            setValue('petId', value);
            setValue('veterinarianId', ''); // Reset vet when pet changes
          }}
          disabled={isPastAppointment || isLoading}
        >
          <SelectTrigger id="petId" aria-invalid={!!errors.petId}>
            <SelectValue placeholder={t('appointments.form.petPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {pets?.map((pet) => (
              <SelectItem key={pet.id} value={pet.id}>
                {pet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.petId && (
          <p className="text-sm text-destructive">{errors.petId.message}</p>
        )}
      </div>

      {/* Veterinarian Selection */}
      <div className="space-y-2">
        <Label htmlFor="veterinarianId">{t('appointments.form.vetLabel')}</Label>
        {selectedPetId && availableVetsData && availableVetsData.length === 0 ? (
          <div className="text-sm p-4 bg-muted/50 rounded-md border">
             <MutedText>{t('appointments.form.noVetsAssigned')}</MutedText>
             <MutedText className="mt-1">{t('appointments.form.assignVetFirst')}</MutedText>
          </div>
        ) : (
          <Select
            value={selectedVetId}
            onValueChange={(value) => setValue('veterinarianId', value)}
            disabled={!selectedPetId || isPastAppointment || isLoading}
          >
            <SelectTrigger id="veterinarianId" aria-invalid={!!errors.veterinarianId}>
              <SelectValue placeholder={selectedPetId ? t('appointments.form.vetPlaceholder') : t('appointments.form.vetPlaceholderNoPet')} />
            </SelectTrigger>
            <SelectContent>
              {availableVetsData?.map((vet) => (
                <SelectItem key={vet.id} value={vet.id}>
                  {vet.clinicName || vet.vetName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.veterinarianId && <ErrorText>{errors.veterinarianId.message}</ErrorText>}
      </div>

      {/* Date and Time Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="appointmentDate">{t('appointments.form.dateLabel')}</Label>
          <Controller
            name="appointmentDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="appointmentDate"
                value={field.value}
                onChange={field.onChange}
                disabled={isPastAppointment || isLoading}
                aria-invalid={!!errors.appointmentDate}
              />
            )}
          />
          {errors.appointmentDate && <ErrorText>{errors.appointmentDate.message}</ErrorText>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="appointmentTime">{t('appointments.form.timeLabel')}</Label>
          <Select
            value={watch('appointmentTime')}
            onValueChange={(value) => setValue('appointmentTime', value)}
            disabled={isPastAppointment || isLoading}
          >
            <SelectTrigger id="appointmentTime" aria-invalid={!!errors.appointmentTime}>
              <SelectValue placeholder={t('appointments.form.timePlaceholder')} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {formatTimeForDisplay(time, displayLocale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.appointmentTime && <ErrorText>{errors.appointmentTime.message}</ErrorText>}
        </div>
      </div>
      
      {/* Appointment Type */}
      <div className="space-y-2">
        <Label htmlFor="appointmentType">{t('appointments.form.typeLabel')}</Label>
        <Select
          value={watch('appointmentType')}
          onValueChange={(value) => setValue('appointmentType', value as AppointmentType)}
          disabled={isPastAppointment || isLoading}
        >
          <SelectTrigger id="appointmentType" aria-invalid={!!errors.appointmentType}>
            <SelectValue placeholder={t('appointments.form.typePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {appointmentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {t(APPOINTMENT_TYPE_KEYS[type])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.appointmentType && <ErrorText>{errors.appointmentType.message}</ErrorText>}
      </div>

      {/* Reason for Visit "Discussion points" */}
      <div className="space-y-2">
        <Label htmlFor="reasonForVisit">{t('appointments.form.discussionPointsLabel')}</Label>
        <Textarea
          id="reasonForVisit"
          placeholder={t('appointments.form.discussionPointsPlaceholder')}
          rows={3}
          {...register('reasonForVisit')}
          aria-invalid={!!errors.reasonForVisit}
          disabled={isPastAppointment || isLoading}
          className="[word-break:break-word]"
          maxLength={100}
        />
        {errors.reasonForVisit && <ErrorText>{errors.reasonForVisit.message}</ErrorText>}
        <HelperText className="text-xs">
          {t('appointments.form.discussionPointsCharCount', { count: watch('reasonForVisit')?.length || 0 })}
        </HelperText>
      </div>

      {/* Visit Notes "Visit summary" (for past and current appointment if hasAppointmentTimePassed) */}
      {(isPastAppointment || hasAppointmentTimePassed) && (
        <div className="space-y-2">
          <Label htmlFor="visitNotes">{t('appointments.form.visitSummaryLabel')}</Label>
          <Textarea
            id="visitNotes"
            placeholder={t('appointments.form.visitSummaryPlaceholder')}
            rows={4}
            {...register('visitNotes')}
            aria-invalid={!!errors.visitNotes}
            disabled={isLoading}
            className="[word-break:break-word]"
            maxLength={200}
          />
          {errors.visitNotes && <ErrorText>{errors.visitNotes.message}</ErrorText>}
          <HelperText className="text-xs">
            {t('appointments.form.visitSummaryCharCount', { count: watch('visitNotes')?.length || 0 })}
          </HelperText>
        </div>
      )}

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
        <Button type="submit" disabled={isLoading || (!!selectedPetId && (!availableVetsData || availableVetsData.length === 0))}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading
            ? (isEditing ? t('appointments.form.submitUpdating') : t('appointments.form.submitCreating'))
            : (isEditing ? t('appointments.form.submitUpdate') : t('appointments.form.submitCreate'))}
        </Button>
      </div>
    </form>
  );
}