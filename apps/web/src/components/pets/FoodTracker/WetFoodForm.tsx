import { Controller } from 'react-hook-form';
import { useWetFoodForm } from '@/hooks/useWetFoodForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { WetFoodEntry, WetFoodFormData } from '@/types/food';
import { ErrorText } from '@/components/ui/typography';
import { getTodayDateString } from '@/lib/utils/date-formatting';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslation } from 'react-i18next';
import { FoodUnitLabel } from './FoodUnitLabel';

interface WetFoodFormProps {
  wetFoodEntry?: WetFoodEntry; // If provided, we're editing
  onSubmit: (data: WetFoodFormData) => Promise<WetFoodEntry | null>;
  onCancel?: () => void,
  isLoading?: boolean;
  submitLabel?: string;
}

export function WetFoodForm({ 
  wetFoodEntry,
  onSubmit, 
  onCancel,
  isLoading = false,
  submitLabel,
}: WetFoodFormProps) {
  const { t } = useTranslation();
  const { units } = usePreferencesContext();
  const wetFoodUnit = units?.wetFoodUnit ?? 'grams';
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    control,
  } = useWetFoodForm({ wetFoodEntry });

  const onFormSubmit = async (data: WetFoodFormData) => {
    await onSubmit(data);
  };
  
  // Recalculate total weight from watched values
  const watchedUnits = watch('numberOfUnits');
  const watchedWeightPerUnit = watch('weightPerUnit');
  const totalWeight =
    watchedUnits && watchedWeightPerUnit
      ? Number(watchedUnits) * parseFloat(watchedWeightPerUnit)
      : 0;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
      {/* Brand Name */}
      <div className="space-y-2">
        <Label htmlFor="brandName">{t('food.shared.brandNameLabel')}</Label>
        <Input
          id="brandName"
          placeholder={t('food.shared.brandNamePlaceholder')}
          maxLength={100}
          {...register('brandName')}
          aria-invalid={!!errors.brandName}
        />
        {errors.brandName && <ErrorText>{errors.brandName.message}</ErrorText>}
      </div>

      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="productName">{t('food.shared.productNameLabel')}</Label>
        <Input
          id="productName"
          placeholder={t('food.wet.productNamePlaceholder')}
          maxLength={150}
          {...register('productName')}
          aria-invalid={!!errors.productName}
        />
        {errors.productName && <ErrorText>{errors.productName.message}</ErrorText>}
      </div>

      {/* Number of Units */}
      <div className="space-y-2">
        <Label htmlFor="numberOfUnits">{t('food.wet.numberOfUnitsLabel')}</Label>
        <Input
          id="numberOfUnits"
          type="number"
          min="1"
          step="1"
          placeholder={t('food.wet.numberOfUnitsPlaceholder')}
          {...register('numberOfUnits')}
          aria-invalid={!!errors.numberOfUnits}
        />
        {errors.numberOfUnits && <ErrorText>{errors.numberOfUnits.message}</ErrorText>}
      </div>

      {/* Weight Per Unit */}
      <div className="space-y-2">
        <Label htmlFor="weightPerUnit">{t('food.wet.weightPerUnitLabel')}</Label>
        <div className="relative">
          <Input
            id="weightPerUnit"
            type="number"
            step="0.01"
            placeholder={t('food.wet.weightPerUnitPlaceholder')}
            className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            {...register('weightPerUnit')}
            aria-invalid={!!errors.weightPerUnit}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
            <FoodUnitLabel unit={wetFoodUnit} />
          </span>
        </div>
        {errors.weightPerUnit && <ErrorText>{errors.weightPerUnit.message}</ErrorText>}
      </div>

      {/* Total Weight Display */}
      {totalWeight > 0 && (
        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-sm font-medium">
          {t('food.wet.totalWeightLabel')} {totalWeight.toFixed(1)} <FoodUnitLabel unit={wetFoodUnit} />
          </p>
        </div>
      )}

      {/* Daily Amount */}
      <div className="space-y-2">
        <Label htmlFor="dailyAmount">{t('food.wet.dailyAmountLabel')}</Label>
          <div className="relative">
            <Input
              id="dailyAmount"
              type="number"
              step="0.01"
              placeholder={t('food.wet.dailyAmountPlaceholder')}
              className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              {...register('dailyAmount')}
              aria-invalid={!!errors.dailyAmount}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
              <FoodUnitLabel unit={wetFoodUnit} />
            </span>
          </div>
          {errors.dailyAmount && <ErrorText>{errors.dailyAmount.message}</ErrorText>}
        </div>
      
      {/* Wet food unit, hidden, derived from user preferences*/}
      <input type="hidden" {...register('wetFoodUnit')} />

      {/* Date Started */}
      <div className="space-y-2">
        <Label htmlFor="dateStarted">{t('food.shared.dateStartedLabel')}</Label>
        <Controller
          name="dateStarted"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="dateStarted"
              value={field.value}
              onChange={field.onChange}
              maxDate={getTodayDateString()}
              aria-invalid={!!errors.dateStarted}
            />
          )}
        />
        {errors.dateStarted && <ErrorText>{errors.dateStarted.message}</ErrorText>}
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
          {submitLabel ?? t('food.wet.addButton')}
        </Button>
      </div>
    </form>
  );
}