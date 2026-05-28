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
import { PetImageUpload } from '@/components/pets/PetImageUpload';
import { MutedText, ErrorText, HelperText } from '../ui/typography';

interface PetFormProps {
  pet?: Pet; // if provided, we're editing
  signedUrl?: string | null; // only in edit mode
  onSubmit: (data: PetFormData) => Promise<Pet | null>; // allow return type to match hook
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function PetForm({ 
  pet, 
  signedUrl = null,
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
    const transformedData: PetFormData = {
      name: formData.name,
      animalType: formData.animalType,
      species: formData.species ?? '',
      gender: formData.gender,
      birthDate: formData.birthDate ?? '',
      weight: formData.weight ?? '',
      weightUnit: formData.weightUnit,
      isNeutered: formData.isNeutered,
      // microchipNumber: null,
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

      {/* Pet Photo — edit mode only, requires existing petId */}
      {isEditing && (
        <div className="space-y-2">
          <Label>Pet Photo</Label>
          <PetImageUpload
            petId={pet.id}
            petName={pet.name}
            signedUrl={signedUrl}
          />
        </div>
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
          <ErrorText>{errors.name.message}</ErrorText>
        )}
      </div>

      {/* Animal Type */}
        <div className="space-y-2">
        <Label htmlFor="animalType">Animal Type *</Label>
        <Select 
            value={watch('animalType')} 
            onValueChange={(value: 'cat' | 'dog') => {
            setValue('animalType', value);
            // Clear species when animal type changes
            setValue('species', '');
            }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select cat or dog" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cat">Cat</SelectItem>
            <SelectItem value="dog">Dog</SelectItem>
          </SelectContent>
        </Select>
        {errors.animalType && (
            <ErrorText>{errors.animalType.message}</ErrorText>
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
            {showSpeciesSuggestions && watch('animalType') && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border bg-background shadow-lg">
                {commonSpeciesSuggestions[watch('animalType') as 'cat' | 'dog']
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
          <ErrorText>{errors.species.message}</ErrorText>
        )}
        <HelperText>
          Optional: Enter your pet&apos;s breed or species, or leave blank
        </HelperText>
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
          <ErrorText>{errors.gender.message}</ErrorText>
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
          <ErrorText>{errors.birthDate.message}</ErrorText>
        )}
        <HelperText>
          Optional: Your pet&apos;s birth date or approximate date
        </HelperText>
      </div>

      {/* Weight - Only show in CREATE mode */}
      {!isEditing && (
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
          <ErrorText>{errors.weight.message}</ErrorText>
        )}
        <HelperText>
          Optional: Current weight (max 200kg / 440lbs)
        </HelperText>
      </div>
      )}

      {/* Message for EDIT mode */}
      {isEditing && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-md border border-muted">
          <HelperText>
            <strong>Weight Tracking:</strong> Use the Weight Tracker to add or update your pet&apos;s weight history.
          </HelperText>
        </div>
      )}

      {/* Microchip Number 
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
      </div> */}

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
          <ErrorText>{errors.notes.message}</ErrorText>
        )}
        <HelperText>
          Optional: Any additional information (max 1000 characters)
        </HelperText>
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