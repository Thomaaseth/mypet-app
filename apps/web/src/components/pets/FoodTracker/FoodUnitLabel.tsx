type FoodUnit = 'kg' | 'lbs' | 'grams' | 'oz';

interface FoodUnitLabelProps {
  unit: FoodUnit;
}

export function FoodUnitLabel({ unit }: FoodUnitLabelProps) {
  switch (unit) {
    case 'oz':
      return <>oz</>;
    case 'kg':
      return <>kg</>;
    case 'lbs':
      return (
        <>
          <span className="@min-[320px]:hidden">lbs</span>
          <span className="hidden @min-[320px]:inline">lbs</span>
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