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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Scale, AlertCircle } from 'lucide-react';
import { useWeightTracker } from '@/hooks/useWeightTracker';
import { useErrorState } from '@/hooks/useErrorsState';
import WeightForm from './WeightForm';
import WeightChart from './WeightChart';
import WeightList from './WeightList';
import { WeightTrackerSkeleton } from '@/components/ui/skeletons/WeightSkeleton';
import type { WeightFormData } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';
import { weightErrorHandler } from '@/lib/api/domains/weights';

interface WeightTrackerProps {
  petId: string;
  weightUnit: WeightUnit;
}

export default function WeightTracker({ petId, weightUnit }: WeightTrackerProps) {
  const { isLoading: isActionLoading, executeAction } = useErrorState();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    weightEntries,
    chartData,
    latestWeight,
    isLoading,
    error,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
  } = useWeightTracker({ petId, weightUnit });

// Handle create weight entry
  const handleCreateEntry = async (data: WeightFormData) => {
    return executeAction(async () => {
      const result = await createWeightEntry(data);
      if (result) {
        setIsAddDialogOpen(false);
      }
      return result;
    }, weightErrorHandler);
  };

  // Handle update weight entry
  const handleUpdateEntry = async (weightId: string, data: Partial<WeightFormData>) => {
    return executeAction(async () => {
      return await updateWeightEntry(weightId, data);
    }, weightErrorHandler);
  };

  // Handle delete weight entry
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
    <div className="space-y-6">
      {/* Header with Add Button */}
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
        
        {/* Quick Stats */}
        {latestWeight && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Latest Weight</p>
                <p className="text-lg font-semibold">
                  {latestWeight.weight} {weightUnit}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-lg font-semibold">{weightEntries.length}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Weight Chart */}
      <WeightChart 
        data={chartData} 
        weightUnit={weightUnit} 
      />

      {/* Weight History Table */}
      <WeightList
        weightEntries={weightEntries}
        weightUnit={weightUnit}
        onUpdateEntry={handleUpdateEntry}
        onDeleteEntry={handleDeleteEntry}
        isLoading={isActionLoading}
      />
    </div>
  );
}