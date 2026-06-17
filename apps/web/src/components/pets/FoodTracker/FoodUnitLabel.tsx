import { WET_FOOD_UNITS } from '@/types/food';

type FoodUnit = typeof WET_FOOD_UNITS[number] | 'kg' | 'pounds';

interface FoodUnitLabelProps {
  unit: FoodUnit;
}

export function FoodUnitLabel({ unit }: FoodUnitLabelProps) {
  switch (unit) {
    case 'oz':
      return <>oz</>;
    case 'kg':
      return <>kg</>;
    case 'pounds':
      return (
        <>
          <span className="@min-[320px]:hidden">lbs</span>
          <span className="hidden @min-[320px]:inline">pounds</span>
        </>
      );
    case 'grams':
      return (
        <>
          <span className="@min-[320px]:hidden">g</span>
          <span className="hidden @min-[320px]:inline">grams</span>
        </>
      );
  }
}