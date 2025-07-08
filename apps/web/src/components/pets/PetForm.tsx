'use client';

import { z } from 'zod'
import { usePetForm } from '@/hooks/usePetForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Pet, PetFormData } from '@/types/pet';
import { commonSpeciesSuggestions, petFormSchema } from '@/lib/validations/pet';

interface PetFormProps {
  pet?: Pet; // If provided, we're editing
  onSubmit: (data: PetFormData) => Promise<Pet | null>; // Allow return type to match hook
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function PetForm({ 
  pet, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  error 
}: PetFormProps) {
  const [showSpeciesSuggestions, setShowSpeciesSuggestions] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = usePetForm({ pet });

  const isEditing = !!pet;
  const watchedSpecies = watch('species');
  const watchedWeightUnit = watch('weightUnit');

  // Handle form submission
 const onFormSubmit = async (formData: z.infer<typeof petFormSchema>) => {
  try {
    // Transform with proper type safety - convert optional fields to required strings
    const transformedData: PetFormData = {
      name: formData.name,
      species: formData.species ?? '',
      gender: formData.gender,
      birthDate: formData.birthDate ?? '',
      weight: formData.weight ?? '',
      weightUnit: formData.weightUnit,
      isNeutered: formData.isNeutered,
      microchipNumber: formData.microchipNumber ?? '',
      notes: formData.notes ?? '',
    };
    
    await onSubmit(transformedData);
  } catch (err) {
    console.error('Form submission error:', err);
  }
};

  // Handle species suggestion click
  const handleSpeciesSuggestion = (suggestion: string) => {
    setValue('species', suggestion);
    clearErrors('species');
    setShowSpeciesSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pet Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Pet Name *</Label>
        <Input
          id="name"
          placeholder="Enter your pet's name"
          {...register('name')}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Species/Breed */}
      <div className="space-y-2">
        <Label htmlFor="species">Species/Breed</Label>
        <div className="relative">
          <Input
            id="species"
            placeholder="e.g., Golden Retriever, Persian Cat, Mixed Breed"
            {...register('species')}
            onFocus={() => setShowSpeciesSuggestions(true)}
            onBlur={() => {
              // Delay hiding to allow clicks on suggestions
              setTimeout(() => setShowSpeciesSuggestions(false), 200);
            }}
            aria-invalid={!!errors.species}
          />
          
          {/* Species Suggestions Dropdown */}
          {showSpeciesSuggestions && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border bg-background shadow-lg">
              {commonSpeciesSuggestions
                .filter(suggestion => 
                  !watchedSpecies || 
                  suggestion.toLowerCase().includes(watchedSpecies.toLowerCase())
                )
                .map((suggestion: string) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                    onMouseDown={() => handleSpeciesSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))
              }
            </div>
          )}
        </div>
        {errors.species && (
          <p className="text-sm text-destructive">{errors.species.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Enter your pet&apos;s breed or species, or leave blank
        </p>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select 
          value={watch('gender')} 
          onValueChange={(value: 'male' | 'female' | 'unknown') => setValue('gender', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        {errors.gender && (
          <p className="text-sm text-destructive">{errors.gender.message}</p>
        )}
      </div>

      {/* Birth Date */}
      <div className="space-y-2">
        <Label htmlFor="birthDate">Birth Date</Label>
        <Input
          id="birthDate"
          type="date"
          {...register('birthDate')}
          aria-invalid={!!errors.birthDate}
        />
        {errors.birthDate && (
          <p className="text-sm text-destructive">{errors.birthDate.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Your pet&apos;s birth date or approximate date
        </p>
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <Label>Weight</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter weight"
              {...register('weight')}
              aria-invalid={!!errors.weight}
            />
          </div>
          <div className="w-24">
            <Select 
              value={watchedWeightUnit} 
              onValueChange={(value: 'kg' | 'lbs') => setValue('weightUnit', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="lbs">lbs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {errors.weight && (
          <p className="text-sm text-destructive">{errors.weight.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Current weight (max 200kg / 440lbs)
        </p>
      </div>

      {/* Microchip Number */}
      <div className="space-y-2">
        <Label htmlFor="microchipNumber">Microchip Number</Label>
        <Input
          id="microchipNumber"
          placeholder="Enter microchip number"
          {...register('microchipNumber')}
          aria-invalid={!!errors.microchipNumber}
        />
        {errors.microchipNumber && (
          <p className="text-sm text-destructive">{errors.microchipNumber.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Letters and numbers only
        </p>
      </div>

      {/* Is Neutered */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isNeutered"
          checked={watch('isNeutered')}
          onCheckedChange={(checked: boolean) => setValue('isNeutered', !!checked)}
        />
        <Label 
          htmlFor="isNeutered" 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Spayed/Neutered
        </Label>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes about your pet..."
          rows={3}
          {...register('notes')}
          aria-invalid={!!errors.notes}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Any additional information (max 1000 characters)
        </p>
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
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading 
            ? (isEditing ? 'Updating...' : 'Creating...') 
            : (isEditing ? 'Update Pet' : 'Create Pet')
          }
        </Button>
      </div>
    </form>
  );
}