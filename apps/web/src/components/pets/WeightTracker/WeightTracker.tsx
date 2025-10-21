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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Scale, AlertCircle, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import WeightForm from './WeightForm';
import WeightChart from './WeightChart';
import WeightList from './WeightList';
import { WeightTrackerSkeleton } from '@/components/ui/skeletons/WeightSkeleton';
import { weightErrorHandler } from '@/lib/api/domains/weights';
import type { WeightFormData, WeightEntry } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';
import { 
  useWeightEntries, 
  useCreateWeightEntry, 
  useUpdateWeightEntry, 
  useDeleteWeightEntry 
} from '@/queries/weights';

interface WeightTrackerProps {
  petId: string;
  weightUnit: WeightUnit;
}

export default function WeightTracker({ petId, weightUnit }: WeightTrackerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Queries
  const { 
    data, 
    isPending, 
    error 
  } = useWeightEntries({ petId, weightUnit });
  
  // Mutations
  const createWeightMutation = useCreateWeightEntry(petId, weightUnit);
  const updateWeightMutation = useUpdateWeightEntry(petId, weightUnit);
  const deleteWeightMutation = useDeleteWeightEntry(petId);

  // Computed loading state
  const isActionLoading = createWeightMutation.isPending || 
                          updateWeightMutation.isPending || 
                          deleteWeightMutation.isPending;

  // Extract data (with defaults for undefined)
  const weightEntries = data?.weightEntries ?? [];
  const chartData = data?.chartData ?? [];
  const latestWeight = data?.latestWeight ?? null;

  // Handlers
  const handleCreateEntry = async (weightData: WeightFormData): Promise<WeightEntry | null> => {
    try {
      const result = await createWeightMutation.mutateAsync(weightData);
      setIsAddDialogOpen(false);
      return result;
    } catch (error) {
      return null;
    }
  };

  const handleUpdateEntry = async (
    weightId: string, 
    weightData: Partial<WeightFormData>
  ): Promise<WeightEntry | null> => {
    try {
      const result = await updateWeightMutation.mutateAsync({ weightId, weightData });
      return result;
    } catch (error) {
      return null;
    }
  };

  const handleDeleteEntry = async (weightId: string): Promise<boolean> => {
    try {
      await deleteWeightMutation.mutateAsync(weightId);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Loading state
  if (isPending) {
    return <WeightTrackerSkeleton />;
  }

  // Error state
  if (error) {
    const appError = weightErrorHandler(error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{appError.message}</AlertDescription>
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
            <Scale className="h-5 w-5" />
            <CardTitle>Weight Tracker</CardTitle>
          </div>
          {/* Only show the "Add Weight Entry" button when there are existing entries */}
          {weightEntries.length > 0 && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Weight Entry
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <WeightChart 
          data={chartData} 
          weightUnit={weightUnit} 
          onAddEntry={() => setIsAddDialogOpen(true)}
        />

        {/* Add Weight Dialog - Controlled programmatically */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Weight Entry</DialogTitle>
              <DialogDescription>
                Record your pet&apos;s weight. All entries will use {weightUnit} as the unit.
              </DialogDescription>
            </DialogHeader>
            <WeightForm
              weightUnit={weightUnit}
              onSubmit={handleCreateEntry}
              onCancel={() => setIsAddDialogOpen(false)}
              isLoading={isActionLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Weight History Card with Collapsible Content */}
        <Card>
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <CardTitle className="text-lg">Weight History</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {weightEntries.length} {weightEntries.length === 1 ? 'entry' : 'entries'}
                    </span>
                    {isHistoryOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {weightEntries.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <p>No weight entries yet. Add your first entry above!</p>
                  </div>
                ) : (
                  <WeightList
                    weightEntries={weightEntries}
                    weightUnit={weightUnit}
                    onUpdateEntry={handleUpdateEntry}
                    onDeleteEntry={handleDeleteEntry}
                    isLoading={isActionLoading}
                  />
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </CardContent>
    </Card>
  );
}