'use client';

import { useWeightForm } from '@/hooks/useWeightForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { WeightEntry, WeightFormData } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';

interface WeightFormProps {
  weightUnit: WeightUnit;
  weightEntry?: WeightEntry; // If provided, we're editing
  onSubmit: (data: WeightFormData) => Promise<WeightEntry | null>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function WeightForm({ 
  weightUnit,
  weightEntry, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  error 
}: WeightFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    resetToEmpty,
  } = useWeightForm({ weightUnit, weightEntry });

  const isEditing = !!weightEntry;

  // Handle form submission
  const onFormSubmit = async (formData: WeightFormData) => {
    try {
      const result = await onSubmit(formData);
      if (result && !isEditing) {
        // Reset form only if creating new entry (not editing)
        resetToEmpty();
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Weight */}
      <div className="space-y-2">
        <Label htmlFor="weight">Weight ({weightUnit}) *</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          min="0"
          placeholder={`Enter weight in ${weightUnit}`}
          {...register('weight')}
          aria-invalid={!!errors.weight}
        />
        {errors.weight && (
          <p className="text-sm text-destructive">{errors.weight.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Maximum: {weightUnit === 'kg' ? '200kg' : '440lbs'}
        </p>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          max={new Date().toISOString().split('T')[0]} // Prevent future dates
          {...register('date')}
          aria-invalid={!!errors.date}
        />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Date cannot be in the future
        </p>
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
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading 
            ? (isEditing ? 'Updating...' : 'Adding...') 
            : (isEditing ? 'Update Entry' : 'Add Entry')
          }
        </Button>
      </div>
    </form>
  );
}