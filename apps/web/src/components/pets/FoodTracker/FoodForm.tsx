'use client';

import { useState, useEffect } from 'react';
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
import { DRY_FOOD_DAILY_UNITS, DRY_FOOD_UNITS, FOOD_TYPE_LABELS, FOOD_UNIT_LABELS, WET_FOOD_DAILY_UNITS, WET_FOOD_UNITS } from '@/types/food';

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
  } = useForm({
    resolver: zodResolver(createFoodSchema),
defaultValues: {
      foodType: initialData?.foodType || 'dry',
      brandName: initialData?.brandName || '',
      productName: initialData?.productName || '',
      bagWeight: initialData?.bagWeight || '',
       bagWeightUnit: initialData?.bagWeightUnit || (
        (initialData?.foodType || 'dry') === 'wet' ? 'grams' : 'kg'
        ),
      dailyAmount: initialData?.dailyAmount || '',
      dailyAmountUnit: initialData?.dailyAmountUnit || 'grams',
      numberOfUnits: initialData?.numberOfUnits || '',
      weightPerUnit: initialData?.weightPerUnit || '',
      weightPerUnitUnit: initialData?.weightPerUnitUnit || 'grams',
      datePurchased: initialData?.datePurchased || new Date().toISOString().split('T')[0],
    },
  });

  const watchedFoodType = watch('foodType');
  const watchedBagWeightUnit = watch('bagWeightUnit');
  const watchedDailyAmountUnit = watch('dailyAmountUnit');
  const watchedWeightPerUnitUnit = watch('weightPerUnitUnit')

    useEffect(() => {
    if (watchedFoodType === 'wet' && !initialData?.bagWeightUnit) {
      setValue('bagWeightUnit', 'grams');
      setValue('weightPerUnitUnit', 'grams');
    } else if (watchedFoodType === 'dry' && !initialData?.bagWeightUnit) {
      setValue('bagWeightUnit', 'kg');
    }
  }, [watchedFoodType, setValue, initialData?.bagWeightUnit]);

  const getAllowedBagUnits = () => {
    return watchedFoodType === 'dry' ? DRY_FOOD_UNITS : WET_FOOD_UNITS;
  };

  const getAllowedDailyUnits = () => {
    return watchedFoodType === 'dry' ? DRY_FOOD_DAILY_UNITS : WET_FOOD_DAILY_UNITS;
  };

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
        <Label>{watchedFoodType === 'wet' ? 'Total Weight' : 'Bag/Container Weight'} *</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder={watchedFoodType === 'wet' ? 'Enter total weight' : 'Enter weight'}
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
                {getAllowedBagUnits().map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {FOOD_UNIT_LABELS[unit]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {errors.bagWeight && (
          <p className="text-sm text-destructive">{errors.bagWeight.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {watchedFoodType === 'wet' 
            ? 'Total weight of all units combined'
            : 'Total weight of the food bag/container you purchased'
          }
        </p>
      </div>

      {/* Wet Food: Number of Units and Weight per Unit */}
      {watchedFoodType === 'wet' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfUnits">Number of Units *</Label>
              <Input
                id="numberOfUnits"
                placeholder="e.g., 12"
                {...register('numberOfUnits')}
                aria-invalid={!!errors.numberOfUnits}
              />
              {errors.numberOfUnits && (
                <p className="text-sm text-destructive">{errors.numberOfUnits.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Number of cans/pouches
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Weight per Unit *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="e.g., 85"
                    {...register('weightPerUnit')}
                    aria-invalid={!!errors.weightPerUnit}
                  />
                </div>
                <div className="w-20">
                  <Select 
                    value={watchedWeightPerUnitUnit} 
                    onValueChange={(value: FoodUnit) => setValue('weightPerUnitUnit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WET_FOOD_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {FOOD_UNIT_LABELS[unit]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors.weightPerUnit && (
                <p className="text-sm text-destructive">{errors.weightPerUnit.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Weight of each can/pouch
              </p>
            </div>
          </div>
        </>
      )}

      {/* Bag Weight
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
      </div> */}

      {/* Daily Amount
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
      </div> */}

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
              onValueChange={(value) => setValue('dailyAmountUnit', value as 'grams' | 'cups' | 'oz')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAllowedDailyUnits().map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {FOOD_UNIT_LABELS[unit]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {errors.dailyAmount && (
          <p className="text-sm text-destructive">{errors.dailyAmount.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          How much your pet consumes per day {getAllowedDailyUnits().includes('cups') ? '(use decimals like 0.25 for 1/4 cup)' : ''}
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