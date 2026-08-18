import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed } from 'lucide-react';
import { DryFoodTracker } from './DryFoodTracker';
import { WetFoodTracker } from './WetFoodTracker';
import { FoodTrackerProvider, useFoodTrackerContext } from './FoodTrackerContext';
import { MetricLabel, MetricValue, MutedText } from '@/components/ui/typography';
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';
import { useTranslation } from 'react-i18next';
import { FOOD_TYPE_TAB_KEYS, FOOD_SUPPLY_LABEL_KEYS } from '@/i18n/enum-keys';
import { Skeleton } from '@/components/ui/skeleton';
import { FoodEntriesSkeleton } from '@/components/ui/skeletons/FoodSkeleton';
import type { FoodType } from '@/types/food';
import { hasCalculatedFields, resolveFoodTab } from '@/lib/utils/food-tab';

interface FoodTrackerProps {
  petId: string;
}

// Internal component that uses the context
function FoodTrackerContent() {
  const { t } = useTranslation();
  const { activeFoodEntries, isLoading } = useFoodTrackerContext();

  // The tab the data implies. When both types are active this is the type of
  // the entry depleting soonest (most urgent info wins); see resolveFoodTab.
  const resolvedTab = resolveFoodTab(activeFoodEntries);

  // null = user hasn't overridden; fall back to the data-derived tab.
  const [userTab, setUserTab] = useState<FoodType | null>(null);
  const activeTab = userTab ?? resolvedTab;

  const { formatDate } = useDateTimeFormatters();

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
        {isLoading ? (
          // One skeleton for the entire tab area until BOTH food types are known,
          // so neither sub-tracker's empty CTA can flash before the other loads.
          <div className="space-y-4">
            <Skeleton className="h-10 w-full mt-2" /> {/* tabs strip */}
            <FoodEntriesSkeleton count={1} />
          </div>
        ) : (
          <>
            {/* Food Status Summary */}
            {activeFoodEntries.length > 0 && (
              <div className="mb-4">
                {activeFoodEntries.length === 1 && hasCalculatedFields(activeFoodEntries[0]) ? (
                  <div className="text-center p-4 bg-muted/75 rounded-lg">
                    <MetricLabel>{t(FOOD_SUPPLY_LABEL_KEYS[activeFoodEntries[0].foodType])}</MetricLabel>
                    <MetricValue>
                      {activeFoodEntries[0].remainingDays > 0
                        ? t('food.tracker.daysRemaining', { count: activeFoodEntries[0].remainingDays })
                        : t('food.tracker.runningOut')}
                    </MetricValue>
                    <MutedText>
                      {activeFoodEntries[0].remainingDays > 0
                        ? t('food.tracker.runsOut', { date: formatDate(activeFoodEntries[0].depletionDate) })
                        : t('food.tracker.needsRestocking')}
                    </MutedText>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {activeFoodEntries
                      .filter(hasCalculatedFields)
                      .sort((a) => (a.foodType === 'dry' ? -1 : 1))
                      .map((entry) => (
                        <div key={entry.id} className="text-center p-4 bg-muted/75 rounded-lg">
                          <div className="text-center">
                            <MetricLabel>{t(FOOD_SUPPLY_LABEL_KEYS[entry.foodType])}</MetricLabel>
                            <MetricValue>
                              {entry.remainingDays > 0
                                ? t('food.tracker.daysRemaining', { count: entry.remainingDays })
                                : t('food.tracker.runningOut')}
                            </MetricValue>
                            <MutedText>
                              {entry.remainingDays > 0
                                ? t('food.tracker.runsOut', { date: formatDate(entry.depletionDate) })
                                : t('food.tracker.needsRestocking')}
                            </MutedText>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

              <Tabs value={activeTab} onValueChange={(value) => setUserTab(value as FoodType)}>
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
          </>
        )}
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