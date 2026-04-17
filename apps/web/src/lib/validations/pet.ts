export * from '@/shared/validations/pet';
import type { WeightUnit } from '@/shared/validations/pet';

// Weight conversion utilities
export const convertWeight = (weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
    if (fromUnit === toUnit) return weight;
    
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return weight * 2.20462;
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
      return weight / 2.20462;
    }
    
    return weight;
  };
  
  export const formatWeight = (weight: string | null, unit: WeightUnit): string => {
    if (!weight) return 'Unknown';
    return `${weight} ${unit}`;
  };
  
  export const getWeightInKg = (weight: string | null, unit: WeightUnit): number | null => {
    if (!weight) return null;
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) return null;
    
    return unit === 'kg' ? weightNum : convertWeight(weightNum, 'lbs', 'kg');
  };
  
  export const getWeightInLbs = (weight: string | null, unit: WeightUnit): number | null => {
    if (!weight) return null;
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) return null;
    
    return unit === 'lbs' ? weightNum : convertWeight(weightNum, 'kg', 'lbs');
  };
  
  // Age calculation utility
  export const calculatePetAge = (birthDate: string | null): string => {
    if (!birthDate) return 'Unknown';
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      const adjustedYears = years - 1;
      const adjustedMonths = months < 0 ? 12 + months : months;
      
      if (adjustedYears === 0) {
        return `${adjustedMonths} month${adjustedMonths !== 1 ? 's' : ''}`;
      }
      return `${adjustedYears} year${adjustedYears !== 1 ? 's' : ''}, ${adjustedMonths} month${adjustedMonths !== 1 ? 's' : ''}`;
    }
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    
    return years === 1 ? '1 year' : `${years} years`;
  };
  
  // Common species suggestions for autocomplete (optional helper)
  export const commonSpeciesSuggestions = {
    cat: [
      'Mixed Breed',
      'Persian Cat',
      'Maine Coon',
      'British Shorthair',
      'Ragdoll',
      'Bengal Cat',
      'Siamese Cat',
      'Russian Blue',
      'Scottish Fold',
    ],
    dog: [
      'Mixed Breed',
      'Labrador Retriever',
      'Golden Retriever',
      'German Shepherd',
      'French Bulldog',
      'Bulldog',
      'Poodle',
      'Beagle',
      'Rottweiler',
      'Yorkshire Terrier',
    ]
  } as const;