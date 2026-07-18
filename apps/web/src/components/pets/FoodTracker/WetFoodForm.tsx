import { useWetFoodForm } from '@/hooks/useWetFoodForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { WetFoodEntry, WetFoodFormData } from '@/types/food';
import { wetFoodSchema } from '@/lib/validations/food';
import { ErrorText } from '@/components/ui/typography';
import { getTodayDateString } from '@/lib/utils/date-formatting';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';

interface WetFoodFormProps {
  wetFoodEntry?: WetFoodEntry; // If provided, we're editing
  onSubmit: (data: WetFoodFormData) => Promise<WetFoodEntry | null>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function WetFoodForm({ 
  wetFoodEntry,
  onSubmit, 
  isLoading = false,
  submitLabel = 'Add Wet Food'
}: WetFoodFormProps) {
  const { units } = usePreferencesContext();
  const wetFoodUnit = units?.wetFoodUnit ?? 'grams';
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useWetFoodForm({ wetFoodEntry });

  const onFormSubmit = async (data: WetFoodFormData) => {
    await onSubmit(data);
  };
  
  // Recalculate total weight from watched values
  const watchedUnits = watch('numberOfUnits');
  const watchedWeightPerUnit = watch('weightPerUnit');
  const totalWeight =
    watchedUnits && watchedWeightPerUnit
      ? parseInt(watchedUnits) * parseFloat(watchedWeightPerUnit)
      : 0;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Brand Name */}
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

      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="productName">Product Name (Optional)</Label>
        <Input
          id="productName"
          placeholder="e.g., Chicken Pâté, Tuna in Gravy"
          maxLength={150}
          {...register('productName')}
        />
        {errors.productName && <ErrorText>{errors.productName.message}</ErrorText>}
      </div>

      {/* Number of Units */}
      <div className="space-y-2">
        <Label htmlFor="numberOfUnits">Number of Cans/Pouches</Label>
        <Input
          id="numberOfUnits"
          type="number"
          min="1"
          step="0.01"
          placeholder="e.g., 12"
          className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...register('numberOfUnits')}
        />
        {errors.numberOfUnits && <ErrorText>{errors.numberOfUnits.message}</ErrorText>}
      </div>

      {/* Weight Per Unit */}
      <div className="space-y-2">
        <Label htmlFor="weightPerUnit">Weight Per Unit</Label>
        <div className="relative">
          <Input
            id="weightPerUnit"
            type="number"
            step="0.01"
            placeholder="e.g., 85"
            className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            {...register('weightPerUnit')}
            aria-invalid={!!errors.weightPerUnit}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
            {wetFoodUnit}
          </span>
        </div>
        {errors.weightPerUnit && <ErrorText>{errors.weightPerUnit.message}</ErrorText>}
      </div>

      {/* Total Weight Display */}
      {totalWeight > 0 && (
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            Total Weight: {totalWeight.toFixed(1)} {wetFoodUnit}
          </p>
        </div>
      )}

      {/* Daily Amount */}
      <div className="space-y-2">
        <Label htmlFor="dailyAmount">Daily Amount</Label>
          <div className="relative">
            <Input
              id="dailyAmount"
              type="number"
              step="0.01"
              placeholder="e.g., 85"
              className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              {...register('dailyAmount')}
              aria-invalid={!!errors.dailyAmount}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
              {wetFoodUnit}
            </span>
          </div>
          {errors.dailyAmount && <ErrorText>{errors.dailyAmount.message}</ErrorText>}
        </div>
      
      {/* Wet food unit, hidden, derived from user preferences*/}
      <input type="hidden" {...register('wetFoodUnit')} />

      {/* Date Started */}
      <div className="space-y-2">
        <Label htmlFor="dateStarted">Date Started</Label>
        <Input
          id="dateStarted"
          type="date"
          max={getTodayDateString()}
          {...register('dateStarted')}
          aria-invalid={!!errors.dateStarted}
        />
        {errors.dateStarted && <ErrorText>{errors.dateStarted.message}</ErrorText>}
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}