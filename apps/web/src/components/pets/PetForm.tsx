import { Controller } from 'react-hook-form';
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
import { Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Pet, PetFormData } from '@/types/pet';
import { commonSpeciesSuggestions, petFormSchema } from '@/lib/validations/pet';
import { PetImageUpload } from '@/components/pets/PetImageUpload';
import { ErrorText, HelperText } from '../ui/typography';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { DatePicker } from '@/components/ui/date-picker';
import { getTodayDateString } from '@/lib/utils/date-formatting';

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
    control,
  } = usePetForm({ pet });

  const isEditing = !!pet;
  const watchedSpecies = watch('species');

  const { units } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? 'kg';

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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>

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
        <Label htmlFor="name">Pet Name</Label>
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
        <Label htmlFor="animalType">Animal Type</Label>
        <Select 
            value={watch('animalType')} 
            onValueChange={(value: 'cat' | 'dog') => {
            setValue('animalType', value);
            // Clear species when animal type changes
            setValue('species', '');
            }}
        >
          <SelectTrigger aria-invalid={!!errors.animalType}>
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
      <Label htmlFor="species">Breed or Nickname</Label>
        <div className="relative">
          <Input
            id="species"
            placeholder="Golden Retriever, Persian Cat or pet's nickname"
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
        <HelperText className="text-xs">
          Optional: Enter a breed, or a nickname if you'd rather — anything goes
        </HelperText>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label htmlFor="sex">Sex</Label>
        <Select 
          value={watch('gender')} 
          onValueChange={(value: 'male' | 'female' | 'unknown') => setValue('gender', value)}
        >
          <SelectTrigger aria-invalid={!!errors.gender}>
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
        <Controller
          name="birthDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              id="birthDate"
              value={field.value}
              onChange={field.onChange}
              maxDate={getTodayDateString()}
              aria-invalid={!!errors.birthDate}
            />
          )}
        />
        {errors.birthDate && (
          <ErrorText>{errors.birthDate.message}</ErrorText>
        )}
        <HelperText className="text-xs">
          Optional: Your pet&apos;s birth date or approximate date
        </HelperText>
      </div>

      {/* Weight - Only show in CREATE mode */}
      {!isEditing && (
      <div className="space-y-2">
        <Label>Weight</Label>
        <div className="relative">
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter your pet's current weight"
            className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"            {...register('weight')}
            aria-invalid={!!errors.weight}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
            {weightUnit}
          </span>
        </div>
        <input type="hidden" {...register('weightUnit')} />
        {errors.weight && <ErrorText>{errors.weight.message}</ErrorText>}
        <HelperText className="text-xs">
          Optional: Current weight (max {weightUnit === 'kg' ? '200kg' : '440lbs'})
        </HelperText>
      </div>
    )}

      {/* Message for EDIT mode */}
      {isEditing && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-md border border-muted">
        <HelperText className="text-xs">
          <strong>Weight Tracking:</strong> Use the Weight Tracker to add or update your pet&apos;s weight history.
          </HelperText>
        </div>
      )}

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
          <ErrorText>{errors.microchipNumber.message}</ErrorText>
        )}
        <HelperText className="text-xs">
          Optional: Letters and numbers only
        </HelperText>
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
          className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Spayed/Neutered
        </Label>
      </div>

      {/* Bio */}
      <div className="space-y-2">
       <Label htmlFor="notes">Bio / About</Label>
        <Textarea
          id="notes"
          placeholder="Fun facts, quirks, things you want to remember about your pet..."
          rows={3}
          maxLength={200}
          {...register('notes')}
          aria-invalid={!!errors.notes}
        />
        {errors.notes && (
          <ErrorText>{errors.notes.message}</ErrorText>
        )}
        <HelperText className="text-xs">
          {watch('notes')?.length ?? 0}/200 characters
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