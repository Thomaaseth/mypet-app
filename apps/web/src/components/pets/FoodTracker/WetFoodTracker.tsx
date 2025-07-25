// apps/web/src/components/pets/FoodTracker/WetFoodTracker.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle } from 'lucide-react';
import { useWetFoodTracker } from '@/hooks/useWetFoodTracker';
import { useErrorState } from '@/hooks/useErrorsState';
import { WetFoodForm } from './WetFoodForm';
import { WetFoodList } from './WetFoodList';
import { FoodTrackerSkeleton } from '@/components/ui/skeletons/FoodSkeleton';
import { foodErrorHandler } from '@/lib/api/domains/food';
import type { WetFoodFormData } from '@/types/food';

interface WetFoodTrackerProps {
  petId: string;
}

export function WetFoodTracker({ petId }: WetFoodTrackerProps) {
  const { isLoading: isActionLoading, executeAction } = useErrorState();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    wetFoodEntries,
    lowStockWetFoodEntries,
    isLoading,
    error,
    createWetFoodEntry,
    updateWetFoodEntry,
    deleteWetFoodEntry,
  } = useWetFoodTracker({ petId });

  const handleCreateEntry = async (data: WetFoodFormData) => {
    return executeAction(async () => {
      const result = await createWetFoodEntry(data);
      if (result) {
        setIsAddDialogOpen(false);
      }
      return result;
    }, foodErrorHandler);
  };

  const handleUpdateEntry = async (foodId: string, data: Partial<WetFoodFormData>) => {
    return executeAction(async () => {
      return await updateWetFoodEntry(foodId, data);
    }, foodErrorHandler);
  };

  const handleDeleteEntry = async (foodId: string): Promise<boolean> => {
    const result = await executeAction(async () => {
      return await deleteWetFoodEntry(foodId);
    }, foodErrorHandler);
    
    return result !== null;
  };

  if (isLoading) {
    return <FoodTrackerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockWetFoodEntries.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lowStockWetFoodEntries.length} wet food {lowStockWetFoodEntries.length === 1 ? 'entry' : 'entries'} running low (≤7 days remaining)
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Entry */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Wet Food Entries</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Wet Food
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Wet Food Entry</DialogTitle>
              <DialogDescription>
                Track new cans/pouches of wet food for your pet.
              </DialogDescription>
            </DialogHeader>
            <WetFoodForm
              onSubmit={handleCreateEntry}
              isLoading={isActionLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Food List */}
      <WetFoodList
        entries={wetFoodEntries}
        onUpdate={handleUpdateEntry}
        onDelete={handleDeleteEntry}
        isLoading={isActionLoading}
      />
    </div>
  );
}