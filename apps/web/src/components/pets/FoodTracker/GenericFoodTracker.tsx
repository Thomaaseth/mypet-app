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
import { Plus, AlertCircle, UtensilsCrossed, Loader2 } from 'lucide-react';
import { useErrorState } from '@/hooks/useErrorsState';
import { FoodEntriesSkeleton } from '@/components/ui/skeletons/FoodSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { foodErrorHandler } from '@/lib/api/domains/food';

// Generic hook interface that both food trackers must conform to
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
  foodType: 'dry' | 'wet';
  onDataChange?: () => Promise<void>;
  
  // Hook and data dependencies (injected by specific tracker)
  hookResult: GenericFoodHookReturn<TEntry, TFormData>;
  
  // Component dependencies (injected by specific tracker)
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
  
  // Labels and text (injected by specific tracker)
  labels: {
    addButton: string;
    dialogTitle: string;
    dialogDescription: string;
    entriesTitle: string;
    alertSingular: string;
    alertPlural: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyButtonText: string;
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
  const [isCreating, setIsCreating] = useState(false);

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
    setIsCreating(true);
    const result = await executeAction(async () => {
      const result = await createFoodEntry(data);
      if (result) {
        setIsAddDialogOpen(false);
        if (onDataChange) {
          await onDataChange();
        }
      }
      return result;
    }, foodErrorHandler);
    setIsCreating(false);
    return result;
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

  // Initial loading state - show appropriate skeleton based on what we expect
  if (isLoading) {
    // During loading, we can't know the final count, but we can make it smarter
    // Show a skeleton that matches the most common case (1 entry) rather than assuming 2
    return (
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-40" /> {/* Title */}
          <Skeleton className="h-10 w-32" /> {/* Add Button */}
        </div>

        {/* Show skeleton for 1 entry (most common case) */}
        <FoodEntriesSkeleton count={1} />
      </div>
    );
  }

  // Empty state logic - show enhanced CTA when no active entries, but still render list for history
  const hasActiveEntries = activeFoodEntries.length > 0;
  const hasFinishedEntries = finishedFoodEntries.length > 0;
  const hasAnyEntries = hasActiveEntries || hasFinishedEntries;
  
  // Show enhanced empty state only if NO entries at all
  if (!hasAnyEntries) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{labels.entriesTitle}</h3>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Empty State - Match food entry card size */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{labels.emptyTitle}</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {labels.emptyDescription}
              </p>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="min-w-[140px]">
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {labels.emptyButtonText}
                      </>
                    )}
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
                    isLoading={isCreating}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal state with entries
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

      {/* Add New Entry Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{labels.entriesTitle}</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isCreating} className="min-w-[140px]">
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {labels.addButton}
                </>
              )}
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
              isLoading={isCreating}
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

      {/* Enhanced Empty State for No Active Entries (but may have finished entries) */}
      {!hasActiveEntries && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{labels.emptyTitle}</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {hasFinishedEntries 
                  ? `All current ${foodType} food has been finished. Add new ${foodType} food to continue tracking.`
                  : labels.emptyDescription
                }
              </p>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="min-w-[140px]">
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {hasFinishedEntries ? `Add New ${foodType === 'dry' ? 'Bag' : 'Cans'}` : labels.emptyButtonText}
                      </>
                    )}
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
                    isLoading={isCreating}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Food List - Always render for history when there are finished entries */}
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