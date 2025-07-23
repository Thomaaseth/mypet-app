'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { createFoodSchema } from '@/lib/validations/food';
import type { FoodEntry, FoodFormData, FoodType, FoodUnit } from '@/types/food';
import { FOOD_TYPE_LABELS, FOOD_UNIT_LABELS } from '@/types/food';

interface FoodFormProps {
  initialData?: Partial<FoodFormData>;
  onSubmit: (data: FoodFormData) => Promise<FoodEntry | null>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function FoodForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: FoodFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FoodFormData>({
    resolver: zodResolver(createFoodSchema),
    defaultValues: {
      foodType: initialData?.foodType || 'dry',
      brandName: initialData?.brandName || '',
      productName: initialData?.productName || '',
      bagWeight: initialData?.bagWeight || '',
      bagWeightUnit: initialData?.bagWeightUnit || 'grams',
      dailyAmount: initialData?.dailyAmount || '',
      dailyAmountUnit: initialData?.dailyAmountUnit || 'grams',
      datePurchased: initialData?.datePurchased || new Date().toISOString().split('T')[0],
    },
  });

  const watchedFoodType = watch('foodType');
  const watchedBagWeightUnit = watch('bagWeightUnit');
  const watchedDailyAmountUnit = watch('dailyAmountUnit');

  const handleFormSubmit = async (data: FoodFormData) => {
    try {
      setSubmitError(null);
      await onSubmit(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save food entry');
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Food Type */}
      <div className="space-y-2">
        <Label htmlFor="foodType">Food Type *</Label>
        <Select 
          value={watchedFoodType} 
          onValueChange={(value: FoodType) => setValue('foodType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select food type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dry">{FOOD_TYPE_LABELS.dry}</SelectItem>
            <SelectItem value="wet">{FOOD_TYPE_LABELS.wet}</SelectItem>
          </SelectContent>
        </Select>
        {errors.foodType && (
          <p className="text-sm text-destructive">{errors.foodType.message}</p>
        )}
      </div>

      {/* Brand Name */}
      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name</Label>
        <Input
          id="brandName"
          placeholder="e.g., Hill's Science Diet"
          {...register('brandName')}
          aria-invalid={!!errors.brandName}
        />
        {errors.brandName && (
          <p className="text-sm text-destructive">{errors.brandName.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: The brand of the food
        </p>
      </div>

      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="productName">Product Name</Label>
        <Input
          id="productName"
          placeholder="e.g., Adult Large Breed Chicken & Rice"
          {...register('productName')}
          aria-invalid={!!errors.productName}
        />
        {errors.productName && (
          <p className="text-sm text-destructive">{errors.productName.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: The specific product name
        </p>
      </div>

      {/* Bag Weight */}
      <div className="space-y-2">
        <Label>Bag/Container Weight *</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter total weight"
              {...register('bagWeight')}
              aria-invalid={!!errors.bagWeight}
            />
          </div>
          <div className="w-20">
            <Select 
              value={watchedBagWeightUnit} 
              onValueChange={(value: FoodUnit) => setValue('bagWeightUnit', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grams">{FOOD_UNIT_LABELS.grams}</SelectItem>
                <SelectItem value="pounds">{FOOD_UNIT_LABELS.pounds}</SelectItem>
                <SelectItem value="cups">{FOOD_UNIT_LABELS.cups}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {errors.bagWeight && (
          <p className="text-sm text-destructive">{errors.bagWeight.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Total weight of the food bag/container you purchased
        </p>
      </div>

      {/* Daily Amount */}
      <div className="space-y-2">
        <Label>Daily Amount *</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter daily amount"
              {...register('dailyAmount')}
              aria-invalid={!!errors.dailyAmount}
            />
          </div>
          <div className="w-20">
            <Select 
              value={watchedDailyAmountUnit} 
              onValueChange={(value: FoodUnit) => setValue('dailyAmountUnit', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grams">{FOOD_UNIT_LABELS.grams}</SelectItem>
                <SelectItem value="pounds">{FOOD_UNIT_LABELS.pounds}</SelectItem>
                <SelectItem value="cups">{FOOD_UNIT_LABELS.cups}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {errors.dailyAmount && (
          <p className="text-sm text-destructive">{errors.dailyAmount.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          How much your pet consumes per day
        </p>
      </div>

      {/* Purchase Date */}
      <div className="space-y-2">
        <Label htmlFor="datePurchased">Purchase Date *</Label>
        <Input
          id="datePurchased"
          type="date"
          {...register('datePurchased')}
          aria-invalid={!!errors.datePurchased}
        />
        {errors.datePurchased && (
          <p className="text-sm text-destructive">{errors.datePurchased.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          When you bought this food
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isFormLoading}
          className="flex-1"
        >
          {isFormLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Food Entry' : 'Add Food Entry'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isFormLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}