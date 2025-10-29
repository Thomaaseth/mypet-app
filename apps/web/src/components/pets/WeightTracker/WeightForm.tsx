import { useWeightForm } from '@/hooks/useWeightForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { WeightEntry, WeightFormData } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    watch,
    setValue,
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
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
            {error}
        </div>
      )}

      {/* Weight */}
      <div className="space-y-2">
        {/* <Label htmlFor="weight">Weight ({weightUnit}) *</Label> */}
        <Label htmlFor="weight">Weight *</Label>
        <Input
          id="weight"
          type="number"
          step="0.0001"
          min="0"
          // placeholder={`Enter weight in ${weightUnit}`}
          placeholder="Enter weight"
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

      {/* Weight Unit */}
      <div className="space-y-2">
        <Label htmlFor="weightUnit">Unit *</Label>
        <Select 
          value={watch('weightUnit')} 
          onValueChange={(value: 'kg' | 'lbs') => setValue('weightUnit', value)}
        >
          <SelectTrigger id="weightUnit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kg">kg</SelectItem>
            <SelectItem value="lbs">lbs</SelectItem>
          </SelectContent>
        </Select>
        {errors.weightUnit && (
          <p className="text-sm text-destructive">{errors.weightUnit.message}</p>
        )}
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