import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed } from 'lucide-react';
import { DryFoodTracker } from './DryFoodTracker';
import { WetFoodTracker } from './WetFoodTracker';
import { FoodTrackerProvider, useFoodTrackerContext } from './FoodTrackerContext';
import { formatDateForDisplay } from '@/lib/utils/date-formatting';
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';
import { MetricLabel, MetricValue, MutedText } from '@/components/ui/typography';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getFallbackDateTimeLocale } from '@/lib/utils/locale';
import { useTranslation } from 'react-i18next';
import { FOOD_TYPE_TAB_KEYS, FOOD_SUPPLY_LABEL_KEYS } from '@/i18n/enum-keys';

interface FoodTrackerProps {
  petId: string;
}

const FOOD_TYPE_LABELS = {
  dry: 'Dry Food',
  wet: 'Wet Food'
};

// Type guard to ensure entries have calculated fields
function hasCalculatedFields(entry: DryFoodEntry | WetFoodEntry): entry is (DryFoodEntry | WetFoodEntry) & {
  remainingDays: number;
  remainingWeight: number;
  depletionDate: string;
} {
  return (
    entry.remainingDays !== undefined &&
    entry.remainingWeight !== undefined &&
    entry.depletionDate !== undefined
  );
}

// Internal component that uses the context
function FoodTrackerContent() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dry' | 'wet'>('dry');
  const { activeFoodEntries, isLoading } = useFoodTrackerContext();

  const { dateTimeLocale } = usePreferencesContext();
  const displayLocale = dateTimeLocale ?? getFallbackDateTimeLocale();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            <CardTitle>{t('food.tracker.title')}</CardTitle> 
          </div>
        <div aria-hidden="true" className="h-9.5" /> {/* spacer, exact default Button height */}
      </div>
      </CardHeader>
      <CardContent>
        {/* Food Status Summary */}
        {activeFoodEntries.length > 0 && !isLoading && (
          <div className="mb-4">
            {activeFoodEntries.length === 1 && hasCalculatedFields(activeFoodEntries[0]) ? (
              // Single food entry
              <div className="text-center p-4 bg-muted/75 rounded-lg">
                  <MetricLabel>{t(FOOD_SUPPLY_LABEL_KEYS[activeFoodEntries[0].foodType])}</MetricLabel>
                  <MetricValue>
                    {activeFoodEntries[0].remainingDays > 0
                      ? t('food.tracker.daysRemaining', { count: activeFoodEntries[0].remainingDays })
                      : t('food.tracker.runningOut')}
                  </MetricValue>
                  <MutedText>
                    {activeFoodEntries[0].remainingDays > 0
                      ? t('food.tracker.runsOut', { date: formatDateForDisplay(activeFoodEntries[0].depletionDate, displayLocale) })
                      : t('food.tracker.needsRestocking')}
                  </MutedText>
                </div>
            ) : (
              // Multiple food entries - side by side
              <div className="grid grid-cols-2 gap-3">
              {activeFoodEntries
                .filter(hasCalculatedFields)
                .sort((a) => a.foodType === 'dry' ? -1 : 1)
                .map((entry) => (
                  <div className="text-center p-4 bg-muted/75 rounded-lg">
                    <div className="text-center">
                    <MetricLabel>{t(FOOD_SUPPLY_LABEL_KEYS[entry.foodType])}</MetricLabel>
                      <MetricValue>
                        {entry.remainingDays > 0
                          ? t('food.tracker.daysRemaining', { count: entry.remainingDays })
                          : t('food.tracker.runningOut')}
                      </MetricValue>
                      <MutedText>
                        {entry.remainingDays > 0
                          ? t('food.tracker.runsOut', { date: formatDateForDisplay(entry.depletionDate, displayLocale) })
                          : t('food.tracker.needsRestocking')}
                      </MutedText>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'dry' | 'wet')}>
          <TabsList className="grid w-full grid-cols-2 mt-2">
            <TabsTrigger value="dry">{t(FOOD_TYPE_TAB_KEYS.dry)}</TabsTrigger>
            <TabsTrigger value="wet">{t(FOOD_TYPE_TAB_KEYS.wet)}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dry" className="mt-4">
            <DryFoodTracker />
          </TabsContent>
          
          <TabsContent value="wet" className="mt-4">
            <WetFoodTracker />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Main component that provides the context
export default function FoodTracker({ petId }: FoodTrackerProps) {
  return (
    <FoodTrackerProvider petId={petId}>
      <FoodTrackerContent />
    </FoodTrackerProvider>
  );
}