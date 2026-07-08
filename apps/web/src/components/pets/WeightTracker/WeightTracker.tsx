import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Scale, AlertCircle, ChevronDown, ChevronRight, Calendar, Target, X,  TrendingUp, TrendingDown, Minus } from 'lucide-react';
import WeightForm from './WeightForm';
import WeightChart from './WeightChart';
import WeightList from './WeightList';
import { WeightTrackerSkeleton } from '@/components/ui/skeletons/WeightSkeleton';
import { weightErrorHandler } from '@/lib/api/domains/weights';
import type { WeightFormData, WeightEntry } from '@/types/weights';
import { 
  useWeightEntries, 
  useCreateWeightEntry, 
  useUpdateWeightEntry, 
  useDeleteWeightEntry 
} from '@/queries/weights';
import { useWeightTarget, useUpsertWeightTarget, useDeleteWeightTarget } from '@/queries/weight-targets';
import TargetRangeForm from './TargetRangeForm';
import type { WeightTargetFormData } from '@/types/weight-targets';
import { MutedText, SectionTitle, HelperText, BodyText } from '@/components/ui/typography';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { convertWeight } from '@/lib/validations/pet';
import { formatDateForDisplay } from '@/lib/utils/date-formatting';
import { getFallbackUnitSystem, getFallbackDateTimeLocale } from '@/lib/utils/locale';
import { getUnitsForSystem } from '@/shared/validations/units';

interface WeightTrackerProps {
  petId: string;
  animalType: 'cat' | 'dog';
}

function getTargetStatusColor(status: 'within' | 'above' | 'below'): string {
  switch (status) {
    case 'above':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'below':
      return 'bg-accent/20 text-accent-foreground border-accent/30';
    case 'within':
      return 'bg-secondary/10 text-secondary border-secondary/20';
  }
}

export default function WeightTracker({ petId, animalType }: WeightTrackerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTargetRangeDialogOpen, setIsTargetRangeDialogOpen] = useState(false);
  const [showLearnMoreDialog, setShowLearnMoreDialog] = useState(false);

  // Queries
  const {  
    data, 
    error 
  } = useWeightEntries({ petId });
  
  const { data: weightTarget } = useWeightTarget(petId);

  type TimeRange = '3M' | '6M' | '1Y' | '2Y' | 'ALL';


  const TIME_RANGE_MONTHS: Record<Exclude<TimeRange, 'ALL'>, number> = {
    '3M': 3,
    '6M': 6,
    '1Y': 12,
    '2Y': 24,
  };

  const [timeRange, setTimeRange] = useState<TimeRange>('6M');
  
  const cutoffDate = (() => {
    if (timeRange === 'ALL') return null;
    const d = new Date();
    d.setMonth(d.getMonth() - TIME_RANGE_MONTHS[timeRange]);
    return d;
  })();
  
  

  const { units, dateTimeLocale } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? getUnitsForSystem(getFallbackUnitSystem()).weightUnit;
  const displayLocale = dateTimeLocale ?? getFallbackDateTimeLocale();

  // Extract data (with defaults for undefined)
  const weightEntries = data?.weightEntries ?? [];

  // Converted chart data in display unit
  const chartData = (data?.chartData ?? []).map(d => ({
    ...d,
    weight: convertWeight(d.weight, 'kg', weightUnit),
  }));
  const latestWeight = data?.latestWeight ?? null;

  const filteredChartData = cutoffDate
  ? chartData.filter(point => point.timestamp >= cutoffDate.getTime())
  : chartData;

  const hasTargetRange = Boolean(weightTarget?.minWeight && weightTarget?.maxWeight);

  // Latest weight converted for display
  const latestWeightForChart = data?.latestWeight ? {
    weight: convertWeight(parseFloat(data.latestWeight.weight), 'kg', weightUnit),
    date: formatDateForDisplay(data.latestWeight.date, displayLocale),
  } : null;

  // Target range converted for chart (must match chart's display unit)
  const targetWeightMinDisplay = weightTarget?.minWeight
  ? convertWeight(parseFloat(weightTarget.minWeight), 'kg', weightUnit)
  : undefined;
  const targetWeightMaxDisplay = weightTarget?.maxWeight
  ? convertWeight(parseFloat(weightTarget.maxWeight), 'kg', weightUnit)
  : undefined;

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

  const getWeightTrend = () => {
    if (chartData.length < 2) return null;
    const secondToLast = chartData[chartData.length - 2].weight;
    const last = chartData[chartData.length - 1].weight;
    const difference = last - secondToLast;
    if (Math.abs(difference) < 0.1) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  };
  
  const trend = getWeightTrend();

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

  
  if (data === undefined) {
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
                      onClick={() => setIsTargetRangeDialogOpen(true)}
                      className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                    >
                      <Target className="h-4 w-4" />
                      <span className="hidden sm:inline">Set Range</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold mb-1">Track your pet&apos;s healthy weight</p>
                    <HelperText>
                      Ask your vet for your pet&apos;s ideal weight range...
                    </HelperText>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button 
                variant="outline"  
                onClick={() => setIsTargetRangeDialogOpen(true)}
                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Edit Range</span>
              </Button>
            )}

            {/* Add Weight Entry Button */}
            {weightEntries.length > 0 && (
              <Button 
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2"
                >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Weight Entry</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <SectionTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weight Progress
              </SectionTitle>
              {trend && (
                <div className="flex items-center gap-1 text-sm">
                  {trend === 'increasing' && <TrendingUp className="h-4 w-4 text-primary" />}
                  {trend === 'decreasing' && <TrendingDown className="h-4 w-4 text-secondary" />}
                  {trend === 'stable' && <Minus className="h-4 w-4 text-accent" />}
                  <span className="hidden @min-[260px]:inline text-muted-foreground capitalize">{trend}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
        <WeightChart 
          data={filteredChartData} 
          weightUnit={weightUnit}
          targetWeightMin={targetWeightMinDisplay}
          targetWeightMax={targetWeightMaxDisplay}
          onAddEntry={() => setIsAddDialogOpen(true)}
          latestWeight={latestWeightForChart ?? { weight: 0, date: '' }}
          filterSlot={
                <div className="flex items-center justify-center sm:justify-start gap-2">
                { /* Target badge (left) */ }
                  {hasTargetRange && weightTarget && status &&(
                    <Badge variant="outline" className={`text-2xs ${getTargetStatusColor(status)}`}>
                      {status === 'within' ? 'On Target' : status === 'above' ? 'Above Target' : 'Below Target'}
                    </Badge>
                  )}

                  {/* Time range filter (right) */}
                  <div className="flex items-center gap-1 sm:ml-auto">
                    {(['3M', '6M', '1Y', '2Y', 'ALL'] as TimeRange[]).map((range) => (
                      <Button
                        key={range}
                        variant={timeRange === range ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 px-2 text-2xs"
                        onClick={() => setTimeRange(range)}
                      >
                      {range}
                    </Button>
                  ))}
                </div>
              </div>
            }
          />
        </CardContent>
        </Card>

        {/* Educational Banner (when no target + has entries) */}
        {!hasTargetRange && weightEntries.length > 0  && (
         <Alert>
          <AlertDescription className="flex items-center justify-between gap-3 text-xs sm:text-sm">
            <span>
            Set a target weight range with your vet.
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button 
                variant="link" 
                className="h-0 p-1 text-xs sm:text-sm"
                onClick={() => setShowLearnMoreDialog(true)}
              >
                Learn more
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsTargetRangeDialogOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Target className="h-4 w-4" />
              </Button>
           </div>
         </AlertDescription>
       </Alert>
        )}

        {/* Add Weight Dialog */}
        <ResponsiveDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          title="Add Weight Entry"
          description={`Record your pet's weight. All entries will use ${weightUnit} as the unit.`}
        >
          <WeightForm
            animalType={animalType}
            onSubmit={handleCreateEntry}
            onCancel={() => setIsAddDialogOpen(false)}
            isLoading={isActionLoading}
          />
        </ResponsiveDialog>

         {/* Target Range Dialog */}
         <ResponsiveDialog
            open={isTargetRangeDialogOpen}
            onOpenChange={setIsTargetRangeDialogOpen}
            title={`${hasTargetRange ? 'Edit' : 'Set'} Target Weight Range`}
            description="Enter the healthy weight range for your pet as recommended by your vet."
          >
            <TargetRangeForm
              key={`target-form-${isTargetRangeDialogOpen}`}
              petName="your pet"
              animalType={animalType}
              currentMin={weightTarget?.minWeight ? parseFloat(weightTarget.minWeight) : undefined}
              currentMax={weightTarget?.maxWeight ? parseFloat(weightTarget.maxWeight) : undefined}
              onSubmit={handleUpsertTargetRange}
              onCancel={() => setIsTargetRangeDialogOpen(false)}
              onDelete={hasTargetRange ? handleDeleteTargetRange : undefined}
              isLoading={upsertTargetMutation.isPending || deleteTargetMutation.isPending}
            />
          </ResponsiveDialog>

        {/* Learn More Dialog */}
        <ResponsiveDialog
          open={showLearnMoreDialog}
          onOpenChange={setShowLearnMoreDialog}
          title="Why track a target weight range?"
        >
          <div className="space-y-4">
            <MutedText>
              A healthy weight range helps you monitor if your pet is underweight, 
              overweight, or right on track. Your veterinarian can provide the best 
              guidance based on:
            </MutedText>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Breed and body type</li>
              <li>Age and activity level</li>
              <li>Overall health condition</li>
            </ul>
            <div className="bg-muted p-3 rounded-md">
              <BodyText>
                Ask your vet &quot;What&apos;s a healthy weight 
                range for your pet.&quot; Then add it to the app.
              </BodyText>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLearnMoreDialog(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowLearnMoreDialog(false);
                setIsTargetRangeDialogOpen(true);
              }}>
                Set Target Range
              </Button>
            </div>
          </div>
        </ResponsiveDialog>

        {/* Weight History Card with Collapsible Content */}
        {weightEntries.length > 0 && (
        <Card>
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/75 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <MutedText className="font-display flex items-center gap-2">
                    Weight History
                  </MutedText>
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
                  <div className="flex items-center justify-center h-32">
                    <MutedText>No weight entries yet. Add your first entry above!</MutedText>
                  </div>
                ) : (
                  <WeightList
                    animalType={animalType}
                    weightEntries={weightEntries}
                    onUpdateEntry={handleUpdateEntry}
                    onDeleteEntry={handleDeleteEntry}
                    isLoading={isActionLoading}
                    isHistoryOpen={isHistoryOpen}
                  />
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
        )}
      </CardContent>
    </Card>
  )
}