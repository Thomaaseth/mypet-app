import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed } from 'lucide-react';
import { DryFoodTracker } from './DryFoodTracker';
import { WetFoodTracker } from './WetFoodTracker';
import { FoodTrackerProvider, useFoodTrackerContext } from './FoodTrackerContext';
import { formatDateForDisplay } from '@/lib/validations/food';
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';
import { MetricLabel, MetricValue, MutedText } from '@/components/ui/typography';


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
  const [activeTab, setActiveTab] = useState<'dry' | 'wet'>('dry');
  const { activeFoodEntries, isLoading } = useFoodTrackerContext();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" />
          Food Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Food Status Summary - Restored! */}
        {activeFoodEntries.length > 0 && !isLoading && (
          <div className="space-y-3 mb-6">
            {activeFoodEntries.length === 1 && hasCalculatedFields(activeFoodEntries[0]) ? (
              // Single food entry
              <div className="p-4 rounded-lg border bg-muted">

                <div className="text-center">
                <MetricLabel>{FOOD_TYPE_LABELS[activeFoodEntries[0].foodType]} Supply</MetricLabel>
                  <MetricValue>
                    {activeFoodEntries[0].remainingDays > 0 ? `${activeFoodEntries[0].remainingDays} days` : 'Running out'}
                  </MetricValue>
                  <MutedText>
                    {activeFoodEntries[0].remainingDays > 0 
                      ? `Runs out ${formatDateForDisplay(activeFoodEntries[0].depletionDate)}`
                      : 'Needs restocking'
                    }
                  </MutedText>
                </div>
              </div>
            ) : (
              // Multiple food entries - side by side
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeFoodEntries
                .filter(hasCalculatedFields)
                .sort((a) => a.foodType === 'dry' ? -1 : 1)
                .map((entry) => (
                <div className="p-4 rounded-lg border bg-muted">
                    <div className="text-center">
                    <MetricLabel>{FOOD_TYPE_LABELS[entry.foodType]} Supply</MetricLabel>
                      <MetricValue>
                        {entry.remainingDays > 0 ? `${entry.remainingDays} days` : 'Running out'}
                      </MetricValue>
                      <MutedText>
                        {entry.remainingDays > 0 
                          ? `Runs out ${formatDateForDisplay(entry.depletionDate)}`
                          : 'Needs restocking'
                        }
                      </MutedText>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'dry' | 'wet')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dry">Dry Food</TabsTrigger>
            <TabsTrigger value="wet">Wet Food</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dry" className="mt-6">
            <DryFoodTracker />
          </TabsContent>
          
          <TabsContent value="wet" className="mt-6">
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