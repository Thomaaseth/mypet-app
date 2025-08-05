// apps/web/src/components/pets/FoodTracker/FoodTracker.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed } from 'lucide-react';
import { DryFoodTracker } from './DryFoodTracker';
import { WetFoodTracker } from './WetFoodTracker';
import { useDryFoodTracker } from '@/hooks/useDryFoodTracker';
import { useWetFoodTracker } from '@/hooks/useWetFoodTracker';
import { formatDateForDisplay } from '@/lib/validations/food';

interface FoodTrackerProps {
 petId: string;
}

const FOOD_TYPE_LABELS = {
 dry: 'Dry Food',
 wet: 'Wet Food'
};

export default function FoodTracker({ petId }: FoodTrackerProps) {
 const [activeTab, setActiveTab] = useState<'dry' | 'wet'>('dry');

 const {
   activeDryFoodEntries,
   isLoading: isDryLoading,
   refetchDryFoodEntries,
 } = useDryFoodTracker({ petId });

 const {
   activeWetFoodEntries, 
   isLoading: isWetLoading,
   refetchWetFoodEntries
 } = useWetFoodTracker({ petId });

 // Combine active entries for summary
 const activeFoodEntries = [...activeDryFoodEntries, ...activeWetFoodEntries];

 const handleDataChange = async () => {
  await Promise.all([
    refetchDryFoodEntries(),
    refetchWetFoodEntries()
  ]);
};

 return (
   <Card className="w-full">
     <CardHeader>
       <CardTitle className="flex items-center gap-2">
         <UtensilsCrossed className="h-5 w-5" />
         Food Tracker
       </CardTitle>
     </CardHeader>
     <CardContent>
       {/* Food Status Summary */}
       {activeFoodEntries.length > 0 && !isDryLoading && !isWetLoading && (
         <div className="space-y-3 mb-6">
           {activeFoodEntries.length === 1 ? (
             // Single food entry
             <div className={`p-4 rounded-lg border ${
                 activeFoodEntries[0].foodType === 'dry' 
                   ? 'bg-amber-50 border-amber-200' 
                   : 'bg-blue-50 border-blue-200'
               }`}>
               <div className="text-center">
                 <p className="text-sm text-muted-foreground mb-1">
                   {FOOD_TYPE_LABELS[activeFoodEntries[0].foodType]} Supply
                 </p>
                 <p className="text-2xl font-bold">
                   {activeFoodEntries[0].remainingDays > 0 ? `${activeFoodEntries[0].remainingDays} days` : 'Running out'}
                 </p>
                 <p className="text-sm text-muted-foreground">
                   {activeFoodEntries[0].remainingDays > 0 
                     ? `Runs out ${formatDateForDisplay(activeFoodEntries[0].depletionDate)}`
                     : 'Needs restocking'
                   }
                 </p>
               </div>
             </div>
           ) : (
             // Multiple food entries - side by side
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {activeFoodEntries.sort((a) => a.foodType === 'dry' ? -1 : 1)
               .map((entry) => (
                 <div 
                   key={entry.id} 
                   className={`p-4 rounded-lg border ${
                     entry.foodType === 'dry' 
                       ? 'bg-amber-50 border-amber-200' 
                       : 'bg-blue-50 border-blue-200'
                   }`}
                 >
                   <div className="text-center">
                     <p className="text-sm text-muted-foreground mb-1">
                       {FOOD_TYPE_LABELS[entry.foodType]} Supply
                     </p>
                     <p className="text-xl font-bold">
                       {entry.remainingDays > 0 ? `${entry.remainingDays} days` : 'Running out'}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {entry.remainingDays > 0 
                         ? `Runs out ${formatDateForDisplay(entry.depletionDate)}`
                         : 'Needs restocking'
                       }
                     </p>
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
           <DryFoodTracker petId={petId} onDataChange={handleDataChange} />
         </TabsContent>
         
         <TabsContent value="wet" className="mt-6">
           <WetFoodTracker petId={petId} onDataChange={handleDataChange}/>
         </TabsContent>
       </Tabs>
     </CardContent>
   </Card>
 );
}