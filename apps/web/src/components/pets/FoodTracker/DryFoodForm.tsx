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

interface DryFoodFormProps {
  dryFoodEntry?: DryFoodEntry;
  onSubmit: (data: DryFoodFormData) => Promise<DryFoodEntry | null>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function DryFoodForm({ 
  dryFoodEntry,
  onSubmit, 
  isLoading = false,
  submitLabel = 'Add Dry Food'
}: DryFoodFormProps) {
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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name (Optional)</Label>
          <Input
              id="brandName"
              placeholder="e.g., Royal Canin, Hill's"
              maxLength={100}
              {...register('brandName')}
            />
          {errors.brandName && <ErrorText>{errors.brandName.message}</ErrorText>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="productName">Product Name (Optional)</Label>
        <Input
          id="productName"
          placeholder="e.g., Adult Chicken & Rice"
          maxLength={150}
          {...register('productName')}
        />
        {errors.productName && <ErrorText>{errors.productName.message}</ErrorText>}
      </div>

      {/* <div className="grid grid-cols-2 gap-4"> */}
      <div className="space-y-2">
        <Label htmlFor="bagWeight">Bag Weight</Label>
        <div className="relative">
          <Input
            id="bagWeight"
            type="number"
            step="0.01"
            placeholder="e.g., 5.5"
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
        <Label htmlFor="dailyAmount">Daily Amount in grams</Label>
        <div className="relative">
        <Input
          id="dailyAmount"
          type="number"
          step="0.01"
          placeholder="e.g., 120"
          className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...register('dailyAmount')}
          aria-invalid={!!errors.dailyAmount}
        />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
            grams
          </span>
        {errors.dailyAmount && <ErrorText>{errors.dailyAmount.message}</ErrorText>}
      </div>
      </div>

      <div className="space-y-2">
      <Label htmlFor="dateStarted">Date Started</Label>
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
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}