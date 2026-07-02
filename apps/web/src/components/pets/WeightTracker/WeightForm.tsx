import { useWeightForm } from '@/hooks/useWeightForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { WeightEntry, WeightFormData } from '@/types/weights';
// import { 
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
import { ErrorText, HelperText } from '@/components/ui/typography';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';

interface WeightFormProps {
  animalType: 'cat' | 'dog';
  weightEntry?: WeightEntry; // If provided, we're editing
  onSubmit: (data: WeightFormData) => Promise<WeightEntry | null>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function WeightForm({ 
  animalType,
  weightEntry, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  error 
}: WeightFormProps) {
  const { units } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? 'kg';
  const {
    register,
    handleSubmit,
    formState: { errors },
    // watch,
    // setValue,
    resetToEmpty,
  } = useWeightForm({ animalType, weightEntry });

  // const currentWeightUnit = watch('weightUnit');

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
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {/* Weight */}
      <div className="space-y-2">
      <Label htmlFor="weight">Weight</Label>
      <div className="relative">
        <Input
          id="weight"
          type="number"
          step="0.01"
          min="0"
          placeholder="Enter weight"
          className="pr-12"
          {...register('weight')}
          aria-invalid={!!errors.weight}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
          {weightUnit}
        </span>
        </div>

        {errors.weight && (
          <ErrorText>{errors.weight.message}</ErrorText>
        )}
          {/* <HelperText>
            Maximum: {weightUnit === 'kg'
              ? (animalType === 'cat' ? '15kg' : '90kg')
              : (animalType === 'cat' ? '33lbs' : '198lbs')}
          </HelperText> */}
      </div>
      
      {/* Weight Unit */}
      <input type="hidden" {...register('weightUnit')} />

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          max={new Date().toISOString().split('T')[0]} // Prevent future dates
          {...register('date')}
          aria-invalid={!!errors.date}
        />
        {errors.date && (
          <ErrorText>{errors.date.message}</ErrorText>
        )}
          <HelperText>Date cannot be in the future</HelperText>
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