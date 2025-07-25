// apps/web/src/components/pets/FoodTracker/FoodTracker.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UtensilsCrossed, AlertCircle } from 'lucide-react';
import { DryFoodTracker } from './DryFoodTracker';
import { WetFoodTracker } from './WetFoodTracker';

interface FoodTrackerProps {
  petId: string;
}

export default function FoodTracker({ petId }: FoodTrackerProps) {
  const [activeTab, setActiveTab] = useState<'dry' | 'wet'>('dry');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" />
          Food Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'dry' | 'wet')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dry">Dry Food</TabsTrigger>
            <TabsTrigger value="wet">Wet Food</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dry" className="mt-6">
            <DryFoodTracker petId={petId} />
          </TabsContent>
          
          <TabsContent value="wet" className="mt-6">
            <WetFoodTracker petId={petId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}