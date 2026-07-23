export * from '@/shared/validations/pet';
export * from '@/shared/utils/units';
import type { TFunction } from 'i18next';

  
  // Age calculation utility
  export const calculatePetAge = (birthDate: string | null, t: TFunction): string => {
    if (!birthDate) return t('pets.age.unknown');
  
    const birth = new Date(birthDate);
    const today = new Date();
  
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
  
    if (today.getDate() < birth.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
  
    if (years === 0) {
      return t('pets.age.months', { count: months });
    }
    if (months === 0) {
      return t('pets.age.years', { count: years });
    }
    return `${t('pets.age.years', { count: years })}, ${t('pets.age.months', { count: months })}`;
  };
