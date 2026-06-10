import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { WetFoodFormData } from '@/types/food';
import { WET_FOOD_UNITS, WetFoodEntry } from '@/types/food';
import { wetFoodSchema } from '@/lib/validations/food';
import { ErrorText } from '@/components/ui/typography';

interface WetFoodFormProps {
  initialData?: Partial<WetFoodFormData>;
  onSubmit: (data: WetFoodFormData) => Promise<WetFoodEntry | null>;
  isLoading?: boolean;
  submitLabel?: string;
}

type WetFoodFormValues = z.infer<typeof wetFoodSchema>;


export function WetFoodForm({ 
  initialData, 
  onSubmit, 
  isLoading = false,
  submitLabel = 'Add Wet Food'
}: WetFoodFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WetFoodFormValues>({
    resolver: zodResolver(wetFoodSchema),
    shouldFocusError: false,
    defaultValues: {
      brandName: initialData?.brandName ?? '',
      productName: initialData?.productName ?? '',
      numberOfUnits: initialData?.numberOfUnits ?? '',
      weightPerUnit: initialData?.weightPerUnit ?? '',
      wetWeightUnit: initialData?.wetWeightUnit ?? 'grams',
      dailyAmount: initialData?.dailyAmount ?? '',
      wetDailyAmountUnit: initialData?.wetDailyAmountUnit ?? 'grams',
      dateStarted: initialData?.dateStarted ?? new Date().toISOString().split('T')[0],
    },
  });

  const onFormSubmit = async (data: WetFoodFormValues) => {
    await onSubmit(data);
  };
  
  // Recalculate total weight from watched values
  const watchedUnits = watch('numberOfUnits');
  const watchedWeightPerUnit = watch('weightPerUnit');
  const totalWeight =
    watchedUnits && watchedWeightPerUnit
      ? parseInt(watchedUnits) * parseFloat(watchedWeightPerUnit)
      : 0;

  // Calculate total weight for display
  // const totalWeight = formData.numberOfUnits && formData.weightPerUnit 
  //   ? parseInt(formData.numberOfUnits) * parseFloat(formData.weightPerUnit)
  //   : 0;

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
          step="1"
          placeholder="e.g., 12"
          {...register('numberOfUnits')}
        />
        {errors.numberOfUnits && <ErrorText>{errors.numberOfUnits.message}</ErrorText>}
      </div>

      {/* Weight Per Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weightPerUnit">Weight Per Unit</Label>
          <Input
            id="weightPerUnit"
            type="number"
            step="0.1"
            placeholder="e.g., 85"
            {...register('weightPerUnit')}
            aria-invalid={!!errors.weightPerUnit}
          />
          {errors.weightPerUnit && <ErrorText>{errors.weightPerUnit.message}</ErrorText>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="wetWeightUnit">Unit</Label>
          <Select
            value={watch('wetWeightUnit')}
            onValueChange={(value) => setValue('wetWeightUnit', value as 'grams' | 'oz')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WET_FOOD_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Total Weight Display */}
      {totalWeight > 0 && (
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            Total Weight: {totalWeight.toFixed(1)} {watch('wetWeightUnit')}
          </p>
        </div>
      )}

      {/* Daily Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dailyAmount">Daily Amount</Label>
          <Input
            id="dailyAmount"
            type="number"
            step="0.1"
            placeholder="e.g., 85"
            {...register('dailyAmount')}
            aria-invalid={!!errors.dailyAmount}
          />
          {errors.dailyAmount && <ErrorText>{errors.dailyAmount.message}</ErrorText>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="wetDailyAmountUnit">Unit</Label>
          <Select
            value={watch('wetDailyAmountUnit')}
            onValueChange={(value) => setValue('wetDailyAmountUnit', value as 'grams' | 'oz')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WET_FOOD_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Started */}
      <div className="space-y-2">
        <Label htmlFor="dateStarted">Date Started</Label>
        <Input
          id="dateStarted"
          type="date"
          max={new Date().toISOString().split('T')[0]}
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