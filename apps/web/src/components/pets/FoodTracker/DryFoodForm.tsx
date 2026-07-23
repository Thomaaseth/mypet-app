import { Controller } from 'react-hook-form';
import { useDryFoodForm } from '@/hooks/useDryFoodForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { ErrorText } from '@/components/ui/typography';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';
import { getTodayDateString } from '@/lib/utils/date-formatting';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslation } from 'react-i18next';

interface DryFoodFormProps {
  dryFoodEntry?: DryFoodEntry;
  onSubmit: (data: DryFoodFormData) => Promise<DryFoodEntry | null>;
  onCancel?: () => void,
  isLoading?: boolean;
  submitLabel?: string;
}

export function DryFoodForm({ 
  dryFoodEntry,
  onSubmit, 
  onCancel,
  isLoading = false,
  submitLabel,
}: DryFoodFormProps) {
  const { t } = useTranslation();
  const { units } = usePreferencesContext();
  const bagWeightUnit = units?.bagWeightUnit ?? 'kg';
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useDryFoodForm({ dryFoodEntry });
  
  const onFormSubmit = async (data: DryFoodFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
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

      <div className="space-y-2">
        <Label htmlFor="productName">{t('food.shared.productNameLabel')}</Label>
        <Input
          id="productName"
          placeholder={t('food.dry.productNamePlaceholder')}
          maxLength={150}
          {...register('productName')}
          aria-invalid={!!errors.productName}
        />
        {errors.productName && <ErrorText>{errors.productName.message}</ErrorText>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bagWeight">{t('food.dry.bagWeightLabel')}</Label>
        <div className="relative">
          <Input
            id="bagWeight"
            type="number"
            step="0.01"
            placeholder={t('food.dry.bagWeightPlaceholder')}
            className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            {...register('bagWeight')}
            aria-invalid={!!errors.bagWeight}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
            {bagWeightUnit}
          </span>
        </div>
        {errors.bagWeight && <ErrorText>{errors.bagWeight.message}</ErrorText>}
      </div>

      <input type="hidden" {...register('bagWeightUnit')} />

      <div className="space-y-2">
        <Label htmlFor="dailyAmount">{t('food.dry.dailyAmountLabel')}</Label>
        <div className="relative">
        <Input
          id="dailyAmount"
          type="number"
          step="0.01"
          placeholder={t('food.dry.dailyAmountPlaceholder')}
          className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...register('dailyAmount')}
          aria-invalid={!!errors.dailyAmount}
        />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
          {t('food.units.grams')}
          </span>
        </div>
        {errors.dailyAmount && <ErrorText>{errors.dailyAmount.message}</ErrorText>}
      </div>

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
          {submitLabel ?? t('food.dry.addButton')}
        </Button>
      </div>
    </form>
  );
}