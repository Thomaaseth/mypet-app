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
import type { WetFoodFormData } from '@/types/food';
import { WET_FOOD_UNITS, WetFoodEntry } from '@/types/food';
import { validateWetFoodData } from '@/lib/validations/food';

// type WetFoodSubmitData = {
//   brandName?: string;
//   productName?: string;
//   numberOfUnits: number; // Number for submission
//   weightPerUnit: string;
//   wetWeightUnit: 'grams' | 'oz';
//   dailyAmount: string;
//   wetDailyAmountUnit: 'grams' | 'oz';
//   dateStarted: string;
// };

interface WetFoodFormProps {
  initialData?: Partial<WetFoodFormData>;
  onSubmit: (data: WetFoodFormData) => Promise<WetFoodEntry | null>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function WetFoodForm({ 
  initialData, 
  onSubmit, 
  isLoading = false,
  submitLabel = 'Add Wet Food'
}: WetFoodFormProps) {
  const [formData, setFormData] = useState<WetFoodFormData>({
    brandName: initialData?.brandName || '',
    productName: initialData?.productName || '',
    numberOfUnits: initialData?.numberOfUnits ? String(initialData.numberOfUnits) : '',
    weightPerUnit: initialData?.weightPerUnit || '',
    wetWeightUnit: initialData?.wetWeightUnit || 'grams',
    dailyAmount: initialData?.dailyAmount || '',
    wetDailyAmountUnit: initialData?.wetDailyAmountUnit || 'grams',
    dateStarted: initialData?.dateStarted || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate the form data
      validateWetFoodData(formData);

      // Submit the converted data
      await onSubmit(formData);

    } catch (error) {
      if (error instanceof Error) {
        // Parse validation errors
        if (error.message.includes('validation failed')) {
          const errorMsg = error.message.replace('Wet food validation failed: ', '');
          setErrors({ general: errorMsg });
        } else {
          setErrors({ general: error.message });
        }
      }
    }
  };

  const updateField = (field: keyof WetFoodFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Calculate total weight for display
  const totalWeight = formData.numberOfUnits && formData.weightPerUnit 
    ? parseInt(formData.numberOfUnits) * parseFloat(formData.weightPerUnit)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand Name */}
      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name (Optional)</Label>
        <Input
          id="brandName"
          value={formData.brandName}
          onChange={(e) => updateField('brandName', e.target.value)}
          placeholder="e.g., Hill's, Wellness"
          maxLength={100}
        />
        {errors.brandName && (
          <p className="text-sm text-red-600">{errors.brandName}</p>
        )}
      </div>

      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="productName">Product Name (Optional)</Label>
        <Input
          id="productName"
          value={formData.productName}
          onChange={(e) => updateField('productName', e.target.value)}
          placeholder="e.g., Chicken Pâté, Tuna in Gravy"
          maxLength={150}
        />
        {errors.productName && (
          <p className="text-sm text-red-600">{errors.productName}</p>
        )}
      </div>

      {/* Number of Units */}
      <div className="space-y-2">
        <Label htmlFor="numberOfUnits">Number of Cans/Pouches *</Label>
        <Input
          id="numberOfUnits"
          type="number"
          min="1"
          step="1"
          value={formData.numberOfUnits}
          onChange={(e) => updateField('numberOfUnits', e.target.value)}
          placeholder="e.g., 12"
          required
        />
        {errors.numberOfUnits && (
          <p className="text-sm text-red-600">{errors.numberOfUnits}</p>
        )}
      </div>

      {/* Weight Per Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weightPerUnit">Weight Per Unit *</Label>
          <Input
            id="weightPerUnit"
            type="number"
            step="0.1"
            value={formData.weightPerUnit}
            onChange={(e) => updateField('weightPerUnit', e.target.value)}
            placeholder="e.g., 85"
            required
          />
          {errors.weightPerUnit && (
            <p className="text-sm text-red-600">{errors.weightPerUnit}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="wetWeightUnit">Unit *</Label>
          <Select
            value={formData.wetWeightUnit}
            onValueChange={(value) => updateField('wetWeightUnit', value as 'grams' | 'oz')}
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
            Total Weight: {totalWeight.toFixed(1)} {formData.wetWeightUnit}
          </p>
        </div>
      )}

      {/* Daily Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dailyAmount">Daily Amount *</Label>
          <Input
            id="dailyAmount"
            type="number"
            step="0.1"
            value={formData.dailyAmount}
            onChange={(e) => updateField('dailyAmount', e.target.value)}
            placeholder="e.g., 85"
            required
          />
          {errors.dailyAmount && (
            <p className="text-sm text-red-600">{errors.dailyAmount}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="wetDailyAmountUnit">Unit *</Label>
          <Select
            value={formData.wetDailyAmountUnit}
            onValueChange={(value) => updateField('wetDailyAmountUnit', value as 'grams' | 'oz')}
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

      {/* Date Purchased */}
      <div className="space-y-2">
        <Label htmlFor="dateStarted">Date Purchased *</Label>
        <Input
          id="dateStarted"
          type="date"
          value={formData.dateStarted}
          onChange={(e) => updateField('dateStarted', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          required
        />
        {errors.dateStarted && (
          <p className="text-sm text-red-600">{errors.dateStarted}</p>
        )}
      </div>

      {/* General Errors */}
      {errors.general && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {errors.general}
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}