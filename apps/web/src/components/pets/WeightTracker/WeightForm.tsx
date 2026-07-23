import { Controller } from 'react-hook-form';
import { useWeightForm } from '@/hooks/useWeightForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { WeightEntry, WeightFormData } from '@/types/weights';
import { ErrorText, HelperText } from '@/components/ui/typography';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getTodayDateString } from '@/lib/utils/date-formatting';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { units } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? 'kg';
  const {
    register,
    handleSubmit,
    formState: { errors },
    resetToEmpty,
    control,
  } = useWeightForm({ animalType, weightEntry });


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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
      {/* Weight */}
      <div className="space-y-2">
      <Label htmlFor="weight">{t('weights.form.weightLabel')}</Label>
      <div className="relative">
        <Input
          id="weight"
          type="number"
          step="0.01"
          min="0"
          placeholder={t('weights.form.weightPlaceholder')}
          className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
      </div>
      
      {/* Weight Unit */}
      <input type="hidden" {...register('weightUnit')} />

      {/* Date */}
      <div className="space-y-2">
       <Label htmlFor="date">{t('weights.form.dateLabel')}</Label>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="date"
              value={field.value}
              onChange={field.onChange}
              maxDate={getTodayDateString()}
              aria-invalid={!!errors.date}
            />
          )}
        />
        {errors.date && (
          <ErrorText>{errors.date.message}</ErrorText>
        )}
          <HelperText>{t('weights.form.dateHelper')}</HelperText>
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
            ? (isEditing ? t('weights.form.submitUpdating') : t('weights.form.submitAdding'))
            : (isEditing ? t('weights.form.submitUpdate') : t('weights.form.submitAdd'))
          }
        </Button>
      </div>
    </form>
  );
}