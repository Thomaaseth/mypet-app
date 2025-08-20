// apps/web/src/components/pets/FoodTracker/DryFoodForm.tsx
'use client';

import { useState } from 'react';
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
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';
import { DRY_FOOD_BAG_UNITS, DRY_FOOD_DAILY_UNITS } from '@/types/food';
import { validateDryFoodData } from '@/lib/validations/food';

interface DryFoodFormProps {
  initialData?: Partial<DryFoodFormData>;
  onSubmit: (data: DryFoodFormData) => Promise<DryFoodEntry | null>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function DryFoodForm({ 
  initialData, 
  onSubmit, 
  isLoading = false,
  submitLabel = 'Add Dry Food'
}: DryFoodFormProps) {
  const [formData, setFormData] = useState<DryFoodFormData>({
    brandName: initialData?.brandName || '',
    productName: initialData?.productName || '',
    bagWeight: initialData?.bagWeight || '',
    bagWeightUnit: initialData?.bagWeightUnit || 'kg',
    dailyAmount: initialData?.dailyAmount || '',
    dryDailyAmountUnit: initialData?.dryDailyAmountUnit || 'grams',
    datePurchased: initialData?.datePurchased || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate form data
      const validatedData = validateDryFoodData(formData);
      await onSubmit(validatedData);
    } catch (error) {
      if (error instanceof Error) {
        // Parse validation errors
        if (error.message.includes('validation failed')) {
          const errorMsg = error.message.replace('Dry food validation failed: ', '');
          setErrors({ general: errorMsg });
        } else {
          setErrors({ general: error.message });
        }
      }
    }
  };

  const updateField = (field: keyof DryFoodFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name (Optional)</Label>
        <Input
          id="brandName"
          value={formData.brandName}
          onChange={(e) => updateField('brandName', e.target.value)}
          placeholder="e.g., Royal Canin, Hill's"
          maxLength={100}
        />
        {errors.brandName && (
          <p className="text-sm text-red-600">{errors.brandName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="productName">Product Name (Optional)</Label>
        <Input
          id="productName"
          value={formData.productName}
          onChange={(e) => updateField('productName', e.target.value)}
          placeholder="e.g., Adult Chicken & Rice"
          maxLength={150}
        />
        {errors.productName && (
          <p className="text-sm text-red-600">{errors.productName}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bagWeight">Bag Weight *</Label>
          <Input
            id="bagWeight"
            type="number"
            step="0.01"
            value={formData.bagWeight}
            onChange={(e) => updateField('bagWeight', e.target.value)}
            placeholder="e.g., 5.5"
            required
          />
          {errors.bagWeight && (
            <p className="text-sm text-red-600">{errors.bagWeight}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bagWeightUnit">Unit *</Label>
          <Select
            value={formData.bagWeightUnit}
            onValueChange={(value) => updateField('bagWeightUnit', value as 'kg' | 'pounds')}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dailyAmount">Daily Amount *</Label>
          <Input
            id="dailyAmount"
            type="number"
            step="0.01"
            value={formData.dailyAmount}
            onChange={(e) => updateField('dailyAmount', e.target.value)}
            placeholder="e.g., 120"
            required
          />
          {errors.dailyAmount && (
            <p className="text-sm text-red-600">{errors.dailyAmount}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dryDailyAmountUnit">Unit *</Label>
          <Select
            value={formData.dryDailyAmountUnit}
            onValueChange={(value) => updateField('dryDailyAmountUnit', value as 'grams' | 'cups')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DRY_FOOD_DAILY_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="datePurchased">Date Purchased *</Label>
        <Input
          id="datePurchased"
          type="date"
          value={formData.datePurchased}
          onChange={(e) => updateField('datePurchased', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          required
        />
        {errors.datePurchased && (
          <p className="text-sm text-red-600">{errors.datePurchased}</p>
        )}
      </div>

      {errors.general && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {errors.general}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}