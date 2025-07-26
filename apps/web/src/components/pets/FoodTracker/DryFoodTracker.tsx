// apps/web/src/components/pets/FoodTracker/DryFoodTracker.tsx
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
import { useDryFoodTracker } from '@/hooks/useDryFoodTracker';
import { useErrorState } from '@/hooks/useErrorsState';
import { DryFoodForm } from './DryFoodForm';
import { DryFoodList } from './DryFoodList';
import { FoodTrackerSkeleton } from '@/components/ui/skeletons/FoodSkeleton';
import { foodErrorHandler } from '@/lib/api/domains/food';
import type { DryFoodFormData } from '@/types/food';

interface DryFoodTrackerProps {
  petId: string;
  onDataChange?: () => Promise<void>; 
}

export function DryFoodTracker({ petId, onDataChange }: DryFoodTrackerProps) {
  const { isLoading: isActionLoading, executeAction } = useErrorState();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    dryFoodEntries,
    lowStockDryFoodEntries,
    isLoading,
    error,
    createDryFoodEntry,
    updateDryFoodEntry,
    deleteDryFoodEntry,
  } = useDryFoodTracker({ petId });

  const handleCreateEntry = async (data: DryFoodFormData) => {
    return executeAction(async () => {
      const result = await createDryFoodEntry(data);
      if (result) {
        setIsAddDialogOpen(false);
      }
      return result;
    }, foodErrorHandler);
  };

  const handleUpdateEntry = async (foodId: string, data: Partial<DryFoodFormData>) => {
    return executeAction(async () => {
      const result = await updateDryFoodEntry(foodId, data);
      if (result && onDataChange) {
        await onDataChange();
      }
      return result;
    }, foodErrorHandler);
  };

  const handleDeleteEntry = async (foodId: string): Promise<boolean> => {
    const result = await executeAction(async () => {
      return await deleteDryFoodEntry(foodId);
    }, foodErrorHandler);
    
    return result !== null;
  };

  if (isLoading) {
    return <FoodTrackerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockDryFoodEntries.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lowStockDryFoodEntries.length} dry food {lowStockDryFoodEntries.length === 1 ? 'entry' : 'entries'} running low (≤7 days remaining)
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Entry */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Dry Food Entries</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Dry Food
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Dry Food Entry</DialogTitle>
              <DialogDescription>
                Track a new bag of dry food for your pet.
              </DialogDescription>
            </DialogHeader>
            <DryFoodForm
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
      <DryFoodList
        entries={dryFoodEntries}
        onUpdate={handleUpdateEntry}
        onDelete={handleDeleteEntry}
        isLoading={isActionLoading}
      />
    </div>
  );
}