export type DryFoodFormData = {
    brandName?: string;
    productName?: string;
    bagWeight: string;
    bagWeightUnit: 'kg' | 'pounds';
    dailyAmount: string;
    dryDailyAmountUnit: 'grams';
    dateStarted: string;
  };
  
  export type WetFoodFormData = {
    brandName?: string;
    productName?: string;
    numberOfUnits: string; // String from form
    weightPerUnit: string;
    wetWeightUnit: 'grams' | 'oz';
    dailyAmount: string;
    wetDailyAmountUnit: 'grams' | 'oz';
    dateStarted: string;
  };