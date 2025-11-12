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
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Scale, AlertCircle, ChevronDown, ChevronRight, Calendar, Target, X } from 'lucide-react';
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
import { useWeightTarget, useUpsertWeightTarget, useDeleteWeightTarget } from '@/queries/weight-targets';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import TargetRangeForm from './TargetRangeForm';
import type { WeightTargetFormData } from '@/types/weight-targets';

interface WeightTrackerProps {
  petId: string;
  animalType: 'cat' | 'dog';
}

export default function WeightTracker({ petId, animalType }: WeightTrackerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTargetRangeDialogOpen, setIsTargetRangeDialogOpen] = useState(false);
  const [showLearnMoreDialog, setShowLearnMoreDialog] = useState(false);
  const [isEducationalBannerDismissed, setIsEducationalBannerDismissed] = 
    useLocalStorage(`weight-target-banner-dismissed-${petId}`, false);

  // Queries
  const {  
    data, 
    isPending, 
    error 
  } = useWeightEntries({ petId });
  
  const { data: weightTarget } = useWeightTarget(petId);

  // Extract data (with defaults for undefined)
  const weightEntries = data?.weightEntries ?? [];
  const chartData = data?.chartData ?? [];
  const latestWeight = data?.latestWeight ?? null;

  const weightUnit = data?.latestWeight?.weightUnit || 'kg';
  const hasTargetRange = Boolean(weightTarget?.minWeight && weightTarget?.maxWeight);

  const getWeightStatus = () => {
    if (!hasTargetRange || !weightTarget || !latestWeight) return null;
    
    const weight = parseFloat(latestWeight.weight);
    const min = parseFloat(weightTarget.minWeight);
    const max = parseFloat(weightTarget.maxWeight);
    
    if (weight < min) return 'below';
    if (weight > max) return 'above';
    return 'within';
  };
  
  const status = getWeightStatus();

  // Mutations
  const createWeightMutation = useCreateWeightEntry(petId, animalType);
  const updateWeightMutation = useUpdateWeightEntry(petId, animalType);
  const deleteWeightMutation = useDeleteWeightEntry(petId);
  const upsertTargetMutation = useUpsertWeightTarget(petId);
  const deleteTargetMutation = useDeleteWeightTarget(petId);

  // Computed loading state
  const isActionLoading = createWeightMutation.isPending || 
                          updateWeightMutation.isPending || 
                          deleteWeightMutation.isPending;



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

  const handleUpsertTargetRange = async (targetData: WeightTargetFormData): Promise<void> => {
    try {
      await upsertTargetMutation.mutateAsync(targetData);
        setIsTargetRangeDialogOpen(false);
    } catch (error) {
      // Error already handled by mutation's onError
      throw error;
    }
  };
  
  const handleDeleteTargetRange = async (): Promise<void> => {
    try {
      await deleteTargetMutation.mutateAsync();
      setIsTargetRangeDialogOpen(false);
    } catch (error) {
      // Error already handled by mutation's onError
      throw error;
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
          <div className="flex items-center gap-2">
            {/* Target Range Button */}
            {!hasTargetRange ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsTargetRangeDialogOpen(true)}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Set Target Range
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold mb-1">Track your pet&apos;s healthy weight</p>
                    <p className="text-sm">
                      Ask your vet for your pet&apos;s ideal weight range. This will show as a 
                      shaded zone on the chart to help you monitor their health.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsTargetRangeDialogOpen(true)}
              >
                <Target className="h-4 w-4 mr-2" />
                Edit Range
              </Button>
            )}
            
            {/* Add Weight Entry Button */}
            {weightEntries.length > 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Weight Entry
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <WeightChart 
          data={chartData} 
          weightUnit={weightUnit}
          targetWeightMin={weightTarget?.minWeight ? parseFloat(weightTarget.minWeight) : undefined}
          targetWeightMax={weightTarget?.maxWeight ? parseFloat(weightTarget.maxWeight) : undefined}
          onAddEntry={() => setIsAddDialogOpen(true)}
        />

        {/* Target Range Display Badge (when exists) */}
        {hasTargetRange && weightTarget && (
          <div className="flex items-center justify-center">
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
              status === 'within' 
                ? 'bg-success/10 border-success/20' 
                : 'bg-warning/10 border-warning/20'
            }`}>
              <Target className={`h-4 w-4 ${
                status === 'within' ? 'text-success' : 'text-warning'
              }`} />
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Target:</span>
                <span className="font-semibold">
                  {weightTarget.minWeight}-{weightTarget.maxWeight} {weightUnit}
                </span>
                {status && status !== 'within' && (
                  <span className="text-xs text-warning">
                    ({status === 'below' ? '↓ Below' : '↑ Above'})
                  </span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto px-2 py-1 text-xs hover:bg-success/20"
                onClick={() => setIsTargetRangeDialogOpen(true)}
              >
                Edit
              </Button>
            </div>
          </div>
        )}

        {/* Educational Banner (when no target + has entries + not dismissed) */}
        {!hasTargetRange && weightEntries.length > 0 && !isEducationalBannerDismissed && (
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Ask your vet for your pet&apos;s target weight range to see it on the chart.
              </span>
              <div className="flex items-center gap-2 ml-4">
                <Button 
                  variant="link" 
                  className="h-auto p-0"
                  onClick={() => setShowLearnMoreDialog(true)}
                >
                  Learn more
                </Button>
                <Button 
                  variant="link" 
                  className="h-auto p-0"
                  onClick={() => setIsTargetRangeDialogOpen(true)}
                >
                  Set target range
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsEducationalBannerDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
              animalType={animalType} 
              weightUnit={weightUnit}
              onSubmit={handleCreateEntry}
              onCancel={() => setIsAddDialogOpen(false)}
              isLoading={isActionLoading}
            />
          </DialogContent>
        </Dialog>

         {/* Target Range Dialog */}
          <Dialog open={isTargetRangeDialogOpen} onOpenChange={setIsTargetRangeDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {hasTargetRange ? 'Edit' : 'Set'} Target Weight Range
                </DialogTitle>
                <DialogDescription>
                  Enter the healthy weight range for your pet as recommended by your vet.
                </DialogDescription>
              </DialogHeader>
              <TargetRangeForm
                key={`target-form-${isTargetRangeDialogOpen}`}
                petId={petId}
                petName="your pet"
                weightUnit={weightUnit}
                currentMin={weightTarget?.minWeight ? parseFloat(weightTarget.minWeight) : undefined}
                currentMax={weightTarget?.maxWeight ? parseFloat(weightTarget.maxWeight) : undefined}
                onSubmit={handleUpsertTargetRange}
                onCancel={() => setIsTargetRangeDialogOpen(false)}
                onDelete={hasTargetRange ? handleDeleteTargetRange : undefined}
                isLoading={upsertTargetMutation.isPending || deleteTargetMutation.isPending}
              />
            </DialogContent>
          </Dialog>

        {/* Learn More Dialog */}
        <Dialog open={showLearnMoreDialog} onOpenChange={setShowLearnMoreDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Why track a target weight range?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A healthy weight range helps you monitor if your pet is underweight, 
                overweight, or right on track. Your veterinarian can provide the best 
                guidance based on:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Breed and body type</li>
                <li>Age and activity level</li>
                <li>Overall health condition</li>
              </ul>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-semibold">
                  💡 At your next visit, simply ask your vet &quot;What&apos;s a healthy weight 
                  range for your pet.&quot; Then add it to the app.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLearnMoreDialog(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowLearnMoreDialog(false);
                    setIsTargetRangeDialogOpen(true);
                  }}
                >
                  Set Target Range
                </Button>
              </div>
            </div>
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
                    animalType={animalType}
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