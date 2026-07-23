import { useTranslation } from 'react-i18next';

type FoodUnit = 'kg' | 'lbs' | 'grams' | 'oz';

interface FoodUnitLabelProps {
  unit: FoodUnit;
}

export function FoodUnitLabel({ unit }: FoodUnitLabelProps) {
  const { t } = useTranslation();

  switch (unit) {
    case 'oz':
      return <>oz</>;
    case 'kg':
      return <>kg</>;
    case 'lbs':
      return <>lbs</>;
    case 'grams':
      return <>{t('food.units.grams')}</>;
  }
}