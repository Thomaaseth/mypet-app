'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, UtensilsCrossed, AlertCircle, Package } from 'lucide-react';
import { useFoodTracker } from '@/hooks/useFoodTracker';
import { useErrorState } from '@/hooks/useErrorsState';
import FoodForm from './FoodForm';
import FoodList from './FoodList';
import { FoodTrackerSkeleton } from '@/components/ui/skeletons/FoodSkeleton';
import { foodErrorHandler } from '@/lib/api/domains/food';
import type { FoodFormData, FoodType } from '@/types/food';
import { FOOD_TYPE_LABELS } from '@/types/food';
import { formatDateForDisplay } from '@/lib/validations/food';

interface FoodTrackerProps {
  petId: string;
}

export default function FoodTracker({ petId }: FoodTrackerProps) {
  const { isLoading: isActionLoading, executeAction } = useErrorState();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FoodType>('dry');

  const {
    activeFoodEntries,
    lowStockEntries,
    isLoading,
    error,
    createFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    getFoodEntriesByType,
  } = useFoodTracker({ petId });

  // Handle create food entry
  const handleCreateEntry = async (data: FoodFormData) => {
    return executeAction(async () => {
      const result = await createFoodEntry(data);
      if (result) {
        setIsAddDialogOpen(false);
        setActiveTab(data.foodType);
      }
      return result;
    }, foodErrorHandler);
  };

  const getInitialFoodType = (): FoodType => {
    return activeTab;
  }

  // Handle update food entry
  const handleUpdateEntry = async (foodId: string, data: Partial<FoodFormData>) => {
    return executeAction(async () => {
      return await updateFoodEntry(foodId, data);
    }, foodErrorHandler);
  };

  // Handle delete food entry
  const handleDeleteEntry = async (foodId: string): Promise<boolean> => {
    const result = await executeAction(async () => {
      return await deleteFoodEntry(foodId);
    }, foodErrorHandler);
    
    return result !== null;
  };

  // Loading state
  if (isLoading) {
    return <FoodTrackerSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Food Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            <CardTitle>Food Tracker</CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Food Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Food Entry</DialogTitle>
                <DialogDescription>
                  Track a new food bag or container for your pet.
                </DialogDescription>
              </DialogHeader>
              <FoodForm
                initialData={{ foodType: getInitialFoodType() }}
                onSubmit={handleCreateEntry}
                onCancel={() => setIsAddDialogOpen(false)}
                isLoading={isActionLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Low Stock Alert */}
        {lowStockEntries.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{lowStockEntries.length} food {lowStockEntries.length === 1 ? 'item' : 'items'}</strong> running low! 
              Consider restocking soon.
            </AlertDescription>
          </Alert>
        )}

        {/* Food Status Summary */}
        {activeFoodEntries.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-lg border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Food Supply Remaining</p>
              {activeFoodEntries.map((entry, index) => (
                <div key={entry.id} className={index > 0 ? "mt-3 pt-3 border-t" : ""}>
                  <p className="text-2xl font-bold">
                    {entry.remainingDays > 0 ? `${entry.remainingDays} days` : 'Finished'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.remainingDays > 0 
                      ? `${FOOD_TYPE_LABELS[entry.foodType]} runs out ${formatDateForDisplay(entry.depletionDate)}`
                      : `${FOOD_TYPE_LABELS[entry.foodType]} finished`
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FoodType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dry" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {FOOD_TYPE_LABELS.dry}
            </TabsTrigger>
            <TabsTrigger value="wet" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {FOOD_TYPE_LABELS.wet}
            </TabsTrigger>
          </TabsList>

          {(['dry', 'wet'] as FoodType[]).map((foodType) => {
            const entriesForType = getFoodEntriesByType(foodType);
            
            return (
              <TabsContent key={foodType} value={foodType} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {FOOD_TYPE_LABELS[foodType]} ({entriesForType.length})
                  </h3>
                </div>

                {entriesForType.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No {FOOD_TYPE_LABELS[foodType]} tracked yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first {foodType} food entry to start tracking consumption.
                    </p>
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add {FOOD_TYPE_LABELS[foodType]}
                    </Button>
                  </div>
                ) : (
                  <FoodList
                    foodEntries={entriesForType}
                    onUpdateEntry={handleUpdateEntry}
                    onDeleteEntry={handleDeleteEntry}
                    isLoading={isActionLoading}
                  />
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}