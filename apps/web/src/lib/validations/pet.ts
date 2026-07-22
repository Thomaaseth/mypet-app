export * from '@/shared/validations/pet';
export * from '@/shared/utils/units';

  
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