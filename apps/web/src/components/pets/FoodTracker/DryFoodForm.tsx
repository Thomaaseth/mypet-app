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
import { dryFoodSchema } from '@/lib/validations/food';
import { DRY_FOOD_BAG_UNITS } from '@/types/food';
import { ErrorText } from '@/components/ui/typography';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';

interface DryFoodFormProps {
  initialData?: Partial<DryFoodFormData>;
  onSubmit: (data: DryFoodFormData) => Promise<DryFoodEntry | null>;
  isLoading?: boolean;
  submitLabel?: string;
}

type DryFoodFormValues = z.infer<typeof dryFoodSchema>;

export function DryFoodForm({ 
  initialData, 
  onSubmit, 
  isLoading = false,
  submitLabel = 'Add Dry Food'
}: DryFoodFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DryFoodFormValues>({
    resolver: zodResolver(dryFoodSchema),
    shouldFocusError: false,
    defaultValues: {
      brandName: initialData?.brandName ?? '',
      productName: initialData?.productName ?? '',
      bagWeight: initialData?.bagWeight ?? '',
      bagWeightUnit: initialData?.bagWeightUnit ?? 'kg',
      dailyAmount: initialData?.dailyAmount ?? '',
      dryDailyAmountUnit: 'grams',
      dateStarted: initialData?.dateStarted ?? new Date().toISOString().split('T')[0],
    },
  });
  
  const onFormSubmit = async (data: DryFoodFormValues) => {
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bagWeight">Bag Weight *</Label>
          <Input
            id="bagWeight"
            type="number"
            step="0.01"
            placeholder="e.g., 5.5"
            {...register('bagWeight')}
            aria-invalid={!!errors.bagWeight}
          />
          {errors.bagWeight && <ErrorText>{errors.bagWeight.message}</ErrorText>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bagWeightUnit">Unit</Label>
          <Select
            value={watch('bagWeightUnit')}
            onValueChange={(value) => setValue('bagWeightUnit', value as 'kg' | 'pounds')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DRY_FOOD_BAG_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyAmount">Daily Amount (grams)</Label>
        <Input
          id="dailyAmount"
          type="number"
          step="0.01"
          placeholder="e.g., 120"
          {...register('dailyAmount')}
          aria-invalid={!!errors.dailyAmount}
        />
        {errors.dailyAmount && <ErrorText>{errors.dailyAmount.message}</ErrorText>}
      </div>

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
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}