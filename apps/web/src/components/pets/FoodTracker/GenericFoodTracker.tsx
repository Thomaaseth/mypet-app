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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Generic hook interface that both food trackers conform to
interface GenericFoodHookReturn<TEntry, TFormData> {
  activeFoodEntries: TEntry[];
  finishedFoodEntries: TEntry[];
  lowStockFoodEntries: TEntry[];
  isLoading: boolean;
  error: string | null;
  createFoodEntry: (data: TFormData) => Promise<TEntry | null>;
  updateFoodEntry: (foodId: string, data: Partial<TFormData>) => Promise<TEntry | null>;
  deleteFoodEntry: (foodId: string) => Promise<boolean>;
  markFoodAsFinished: (foodId: string) => Promise<boolean>;
  updateFinishDate: (foodId: string, dateFinished: string) => Promise<TEntry | null>;
}

// Generic props interface
interface GenericFoodTrackerProps<TEntry, TFormData> {
  foodType: 'dry' | 'wet';
  
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
    onMarkAsFinished: (foodId: string) => Promise<boolean>;
    onUpdateFinishDate: (foodId: string, dateFinished: string) => Promise<TEntry | null>;  // ADD THIS
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
    markFoodAsFinished,
    updateFinishDate,
  } = hookResult;

  const hasActiveEntry = activeFoodEntries.length > 0;
  const disableAddButton = hasActiveEntry;
  const tooltipText = "You can only have one active entry per type of food at any time. Please edit/delete the existing active entry if you need to make changes.";
  console.log(`[${foodType}] GenericFoodTracker - Active entries:`, activeFoodEntries.length, 'Disabled:', disableAddButton);

  const handleCreateEntry = async (data: TFormData) => {
    setIsCreating(true);
    const result = await executeAction(async () => {
      const result = await createFoodEntry(data);
      if (result) {
        setIsAddDialogOpen(false);
        // no onDataChange call - hook already updates local state optimistically
      }
      return result;
    }, foodErrorHandler);
    setIsCreating(false);
    return result;
  };

  const handleUpdateEntry = async (foodId: string, data: Partial<TFormData>) => {
    return executeAction(async () => {
      const result = await updateFoodEntry(foodId, data);
      // no onDataChange call - hook already updates local state optimistically
      return result;
    }, foodErrorHandler);
  };

  const handleDeleteEntry = async (foodId: string): Promise<boolean> => {
    const result = await executeAction(async () => {
      const success = await deleteFoodEntry(foodId);
      // no onDataChange call - hook already updates local state optimistically
      return success;
    }, foodErrorHandler);
    
    return result !== null;
  };
  
  const handleMarkAsFinished = async (foodId: string): Promise<boolean> => {
    const result = await executeAction(async () => {
      const success = await markFoodAsFinished(foodId);
      // no onDataChange call - hook already updates local state optimistically
      return success;
    }, foodErrorHandler);
    return result || false;
  };

// Initial loading state - show appropriate skeleton based on what we expect
if (isLoading) {
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

// Empty state logic - enhanced CTA when no active entries
const hasActiveEntries = activeFoodEntries.length > 0;
const hasFinishedEntries = finishedFoodEntries.length > 0;

// enhanced empty state when NO ACTIVE entries (regardless of finished entries)
if (!hasActiveEntries) {
  // No active entries - show CTA (button is always enabled here)
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

      {/* Show history if exists */}
      {hasFinishedEntries && (
        <ListComponent
          entries={activeFoodEntries}
          finishedEntries={finishedFoodEntries}
          onUpdate={handleUpdateEntry}
          onDelete={handleDeleteEntry}
          onUpdateFinishDate={updateFinishDate}
          onMarkAsFinished={handleMarkAsFinished}
          isLoading={isActionLoading}
        />
      )}
    </div>
  );
}

// Normal state - HAS active entries (button always disabled here)
return (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">{labels.entriesTitle}</h3>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled={true}>
                  <Plus className="h-4 w-4 mr-2" />
                  {labels.addButton}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
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

    {/* Food List - Always render (includes history when there are finished entries) */}
    <ListComponent
      entries={activeFoodEntries}
      finishedEntries={finishedFoodEntries}
      onUpdate={handleUpdateEntry}
      onDelete={handleDeleteEntry}
      onUpdateFinishDate={updateFinishDate}
      onMarkAsFinished={handleMarkAsFinished}
      isLoading={isActionLoading}
    />
  </div>
);
}