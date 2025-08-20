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
import { useErrorState } from '@/hooks/useErrorsState';
import { FoodTrackerSkeleton } from '@/components/ui/skeletons/FoodSkeleton';
import { foodErrorHandler } from '@/lib/api/domains/food';

interface GenericFoodHookReturn<TEntry, TFormData> {
  activeFoodEntries: TEntry[];
  finishedFoodEntries: TEntry[];
  lowStockFoodEntries: TEntry[];
  isLoading: boolean;
  error: string | null;
  createFoodEntry: (data: TFormData) => Promise<TEntry | null>;
  updateFoodEntry: (foodId: string, data: Partial<TFormData>) => Promise<TEntry | null>;
  deleteFoodEntry: (foodId: string) => Promise<boolean>;
}

// Generic props interface
interface GenericFoodTrackerProps<TEntry, TFormData> {
  petId: string;
  foodType: 'dry' | 'wet';
  onDataChange?: () => Promise<void>;
  
  hookResult: GenericFoodHookReturn<TEntry, TFormData>;
  
  FormComponent: React.ComponentType<{
    onSubmit: (data: TFormData) => Promise<TEntry | null>;
    isLoading?: boolean;
  }>;
  ListComponent: React.ComponentType<{
    entries: TEntry[];
    finishedEntries: TEntry[];
    onUpdate: (foodId: string, data: Partial<TFormData>) => Promise<TEntry | null>;
    onDelete: (foodId: string) => Promise<boolean>;
    isLoading?: boolean;
  }>;
  
  labels: {
    addButton: string;
    dialogTitle: string;
    dialogDescription: string;
    entriesTitle: string;
    alertSingular: string;
    alertPlural: string;
  };
}

export function GenericFoodTracker<TEntry, TFormData>({
  foodType,
  onDataChange,
  hookResult,
  FormComponent,
  ListComponent,
  labels,
}: GenericFoodTrackerProps<TEntry, TFormData>) {
  const { isLoading: isActionLoading, executeAction } = useErrorState();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    activeFoodEntries,
    finishedFoodEntries,
    lowStockFoodEntries,
    isLoading,
    error,
    createFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
  } = hookResult;

  const handleCreateEntry = async (data: TFormData) => {
    return executeAction(async () => {
      const result = await createFoodEntry(data);
      if (result) {
        setIsAddDialogOpen(false);
        if (onDataChange) {
          await onDataChange();
        }
      }
      return result;
    }, foodErrorHandler);
  };

  const handleUpdateEntry = async (foodId: string, data: Partial<TFormData>) => {
    return executeAction(async () => {
      const result = await updateFoodEntry(foodId, data);
      if (result && onDataChange) {
        await onDataChange();
      }
      return result;
    }, foodErrorHandler);
  };

  const handleDeleteEntry = async (foodId: string): Promise<boolean> => {
    const result = await executeAction(async () => {
      const success = await deleteFoodEntry(foodId);
      if (success && onDataChange) {
        await onDataChange();
      }
      return success;
    }, foodErrorHandler);
    
    return result !== null;
  };

  if (isLoading) {
    return <FoodTrackerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockFoodEntries.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lowStockFoodEntries.length} {foodType} food {lowStockFoodEntries.length === 1 ? labels.alertSingular : labels.alertPlural} running low (≤7 days remaining)
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Entry */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{labels.entriesTitle}</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {labels.addButton}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{labels.dialogTitle}</DialogTitle>
              <DialogDescription>
                {labels.dialogDescription}
              </DialogDescription>
            </DialogHeader>
            <FormComponent
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
      <ListComponent
        entries={activeFoodEntries}
        finishedEntries={finishedFoodEntries}
        onUpdate={handleUpdateEntry}
        onDelete={handleDeleteEntry}
        isLoading={isActionLoading}
      />
    </div>
  );
}