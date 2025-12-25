import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useAppointmentForm } from '@/hooks/useAppointmentForm';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { AppointmentWithRelations, AppointmentFormData, AppointmentType } from '@/types/appointments';
import { appointmentFormSchema, appointmentTypes, generateTimeOptions } from '@/lib/validations/appointments';
import { usePets } from '@/queries/pets';
import { useVeterinarians } from '@/queries/vets';
import { usePetVets } from '@/queries/vets';
import { useLastVetForPet } from '@/queries/appointments';

interface AppointmentFormProps {
  appointment?: AppointmentWithRelations;
  prefilledPetId?: string; // For "Book Appointment" from pet profile
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
  const isEditing = !!appointment;
  const isPastAppointment = appointment && new Date(appointment.appointmentDate) < new Date();

  // Fetch pets and vets
  const { data: pets } = usePets();
  const { data: vets } = useVeterinarians();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useAppointmentForm({ appointment, defaultValues: prefilledPetId ? { petId: prefilledPetId } : undefined });

  const selectedPetId = watch('petId');
  const selectedVetId = watch('veterinarianId');

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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pet Selection */}
      <div className="space-y-2">
        <Label htmlFor="petId">Pet *</Label>
        <Select
          value={selectedPetId}
          onValueChange={(value) => {
            setValue('petId', value);
            setValue('veterinarianId', ''); // Reset vet when pet changes
          }}
          disabled={isPastAppointment || isLoading}
        >
          <SelectTrigger id="petId" aria-invalid={!!errors.petId}>
            <SelectValue placeholder="Select a pet" />
          </SelectTrigger>
          <SelectContent>
            {pets?.map((pet) => (
              <SelectItem key={pet.id} value={pet.id}>
                {pet.name} ({pet.animalType})
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
        <Label htmlFor="veterinarianId">Veterinarian *</Label>
        {selectedPetId && availableVetsData && availableVetsData.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/50">
            <p>No veterinarians assigned to this pet yet.</p>
            <p className="mt-1">Please assign a veterinarian to this pet first in the Vets section.</p>
          </div>
        ) : (
          <Select
            value={selectedVetId}
            onValueChange={(value) => setValue('veterinarianId', value)}
            disabled={!selectedPetId || isPastAppointment || isLoading}
          >
            <SelectTrigger id="veterinarianId" aria-invalid={!!errors.veterinarianId}>
              <SelectValue placeholder={selectedPetId ? "Select a veterinarian" : "Select a pet first"} />
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
        {errors.veterinarianId && (
          <p className="text-sm text-destructive">{errors.veterinarianId.message}</p>
        )}
      </div>

      {/* Date and Time Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="appointmentDate">Date *</Label>
          <Input
            id="appointmentDate"
            type="date"
            {...register('appointmentDate')}
            aria-invalid={!!errors.appointmentDate}
            disabled={isPastAppointment || isLoading}
          />
          {errors.appointmentDate && (
            <p className="text-sm text-destructive">{errors.appointmentDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="appointmentTime">Time *</Label>
          <Select
            value={watch('appointmentTime')}
            onValueChange={(value) => setValue('appointmentTime', value)}
            disabled={isPastAppointment || isLoading}
          >
            <SelectTrigger id="appointmentTime" aria-invalid={!!errors.appointmentTime}>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.appointmentTime && (
            <p className="text-sm text-destructive">{errors.appointmentTime.message}</p>
          )}
        </div>
      </div>

      {/* Appointment Type */}
      <div className="space-y-2">
        <Label htmlFor="appointmentType">Appointment Type *</Label>
        <Select
          value={watch('appointmentType')}
          onValueChange={(value) => setValue('appointmentType', value as AppointmentType)}
          disabled={isPastAppointment || isLoading}
        >
          <SelectTrigger id="appointmentType" aria-invalid={!!errors.appointmentType}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {appointmentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.appointmentType && (
          <p className="text-sm text-destructive">{errors.appointmentType.message}</p>
        )}
      </div>

      {/* Reason for Visit */}
      <div className="space-y-2">
        <Label htmlFor="reasonForVisit">Reminders/Notes</Label>
        <Textarea
          id="reasonForVisit"
          placeholder="Topics to discuss with the veterinarian"
          rows={3}
          {...register('reasonForVisit')}
          aria-invalid={!!errors.reasonForVisit}
          disabled={isPastAppointment || isLoading}
          className="[word-break:break-word]"
        />
        {errors.reasonForVisit && (
          <p className="text-sm text-destructive">{errors.reasonForVisit.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Max 500 characters
        </p>
      </div>

      {/* Visit Notes - only for past appointments */}
      {(isPastAppointment) && (
        <div className="space-y-2">
          <Label htmlFor="visitNotes">Visit Summary</Label>
          <Textarea
            id="visitNotes"
            placeholder="Notes and recommendations from the vet visit..."
            rows={4}
            {...register('visitNotes')}
            aria-invalid={!!errors.visitNotes}
            disabled={isLoading}
            className="[word-break:break-word]"
          />
          {errors.visitNotes && (
            <p className="text-sm text-destructive">{errors.visitNotes.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Optional: Max 1000 characters
          </p>
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
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || (!!selectedPetId && (!availableVetsData || availableVetsData.length === 0))}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading
            ? (isEditing ? 'Updating...' : 'Creating...')
            : (isEditing ? 'Update Appointment' : 'Create Appointment')}
        </Button>
      </div>
    </form>
  );
}