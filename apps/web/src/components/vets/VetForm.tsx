import { z } from 'zod'
import { useVetForm } from '@/hooks/useVetForm';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';
import { baseVeterinarianFormSchema } from '@/lib/validations/veterinarians';

interface VetFormProps {
  vet?: Veterinarian;
  onSubmit: (data: VeterinarianFormData) => Promise<Veterinarian | null>;
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
  const isEditing = !!vet;

  const {
    register,
    handleSubmit,
    formState: { errors },
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

      <div className="space-y-2">
        <Label htmlFor="vetName">Veterinarian Name *</Label>
        <Input
          id="vetName"
          placeholder="Dr. Sarah Johnson"
          {...register('vetName')}
          aria-invalid={!!errors.vetName}
        />
        {errors.vetName && (
          <p className="text-sm text-destructive">{errors.vetName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clinicName">Clinic Name</Label>
        <Input
          id="clinicName"
          placeholder="Happy Paws Veterinary Clinic"
          {...register('clinicName')}
          aria-invalid={!!errors.clinicName}
        />
        {errors.clinicName && (
          <p className="text-sm text-destructive">{errors.clinicName.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Leave blank if the vet doesn&apos;t work at a clinic
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          {...register('phone')}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="contact@happypaws.com"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://www.happypaws.com"
          {...register('website')}
          aria-invalid={!!errors.website}
        />
        {errors.website && (
          <p className="text-sm text-destructive">{errors.website.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Must start with http:// or https://
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine1">Address *</Label>
        <Input
          id="addressLine1"
          placeholder="123 Main Street"
          {...register('addressLine1')}
          aria-invalid={!!errors.addressLine1}
        />
        {errors.addressLine1 && (
          <p className="text-sm text-destructive">{errors.addressLine1.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine2">Address Line 2</Label>
        <Input
          id="addressLine2"
          placeholder="Suite 100"
          {...register('addressLine2')}
          aria-invalid={!!errors.addressLine2}
        />
        {errors.addressLine2 && (
          <p className="text-sm text-destructive">{errors.addressLine2.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Apartment, suite, unit, etc.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="New York"
            {...register('city')}
            aria-invalid={!!errors.city}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP Code *</Label>
          <Input
            id="zipCode"
            placeholder="10001"
            {...register('zipCode')}
            aria-invalid={!!errors.zipCode}
          />
          {errors.zipCode && (
            <p className="text-sm text-destructive">{errors.zipCode.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional information about this veterinarian..."
          rows={3}
          {...register('notes')}
          aria-invalid={!!errors.notes}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Office hours, specialties, or other notes (max 1000 characters)
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading
            ? isEditing
              ? 'Updating...'
              : 'Creating...'
            : isEditing
            ? 'Update Veterinarian'
            : 'Add Veterinarian'}
        </Button>
      </div>
    </form>
  );
}