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
import { useWeightTracker } from '@/hooks/useWeightTracker';
import { useErrorState } from '@/hooks/useErrorsState';
import WeightForm from './WeightForm';
import WeightChart from './WeightChart';
import WeightList from './WeightList';
import { WeightTrackerSkeleton } from '@/components/ui/skeletons/WeightSkeleton';
import { weightErrorHandler } from '@/lib/api/domains/weights';
import type { WeightFormData } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';

interface WeightTrackerProps {
  petId: string;
  weightUnit: WeightUnit;
}

export default function WeightTracker({ petId, weightUnit }: WeightTrackerProps) {
  const { isLoading: isActionLoading, executeAction } = useErrorState();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    weightEntries,
    chartData,
    // latestWeight,
    isLoading,
    error,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
  } = useWeightTracker({ petId, weightUnit });

  const handleCreateEntry = async (data: WeightFormData) => {
    return executeAction(async () => {
      const result = await createWeightEntry(data);
      if (result) {
        setIsAddDialogOpen(false);
      }
      return result;
    }, weightErrorHandler);
  };

  const handleUpdateEntry = async (weightId: string, data: Partial<WeightFormData>) => {
    return executeAction(async () => {
      return await updateWeightEntry(weightId, data);
    }, weightErrorHandler);
  };

  const handleDeleteEntry = async (weightId: string): Promise<boolean> => {
    const result = await executeAction(async () => {
      return await deleteWeightEntry(weightId);
    }, weightErrorHandler);
    
    return result !== null;
  };

  // Loading state
  if (isLoading) {
    return <WeightTrackerSkeleton />;
  }

  // Error state
  if (error) {
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
            <Scale className="h-5 w-5" />
            <CardTitle>Weight Tracker</CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Weight Entry
              </Button>
            </DialogTrigger>
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
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <WeightChart 
          data={chartData} 
          weightUnit={weightUnit} 
        />

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