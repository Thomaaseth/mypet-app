import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Calendar, Weight, Utensils, CheckSquare, MoreHorizontal } from 'lucide-react';
import { DryFoodForm } from './DryFoodForm';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';
import { formatDateForDisplay } from '@/lib/validations/food';
import { FoodHistorySection } from './FoodHistorySection';
import { MarkAsFinishedDialog } from './MarkAsFinishedDialog';
import { formatRemainingWeight } from '@/lib/utils/food-formatting';
import { StatLabel, StatValue, MutedText, SectionTitle } from '@/components/ui/typography';

// Type guard to ensure active entries have required calculated fields
function isValidActiveEntry(entry: DryFoodEntry): entry is DryFoodEntry & {
  remainingDays: number;
  remainingWeight: number;
  depletionDate: string;
} {
  return (
    entry.isActive &&
    entry.remainingDays !== undefined &&
    entry.remainingWeight !== undefined &&
    entry.depletionDate !== undefined
  );
}

interface DryFoodListProps {
  entries: DryFoodEntry[];
  finishedEntries: DryFoodEntry[];
  onUpdate: (foodId: string, data: Partial<DryFoodFormData>) => Promise<DryFoodEntry | null>;
  onDelete: (foodId: string) => Promise<boolean>;
  onMarkAsFinished: (foodId: string) => Promise<boolean>;
  onUpdateFinishDate: (foodId: string, dateFinished: string) => Promise<DryFoodEntry | null>;
  isLoading?: boolean;
}

export function DryFoodList({ 
  entries, 
  finishedEntries, 
  onUpdate, 
  onDelete, 
  onMarkAsFinished, 
  onUpdateFinishDate,
  isLoading = false 
}: DryFoodListProps) {
  const [editingEntry, setEditingEntry] = useState<DryFoodEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<DryFoodEntry | null>(null);
  // const [markingAsFinished, setMarkingAsFinished] = useState<string | null>(null);
  const [markingFinishedEntry, setMarkingFinishedEntry] = useState<DryFoodEntry | null>(null);

  const handleUpdate = async (data: DryFoodFormData) => {
    if (!editingEntry) return null;
    
    const result = await onUpdate(editingEntry.id, data);
    if (result) {
      setEditingEntry(null);
    }
    return result;
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    
    const success = await onDelete(deletingEntry.id);
    if (success) {
      setDeletingEntry(null);
    }
  };
  
  const getStatusSection = (entry: DryFoodEntry & { 
    remainingDays: number; 
    remainingWeight: number; 
    depletionDate: string;
  }) => {
    const isCalculatedFinished = entry.remainingDays <= 0;
    
    if (isCalculatedFinished) {
      return <Badge variant="destructive">Finished</Badge>;
    } else if (entry.remainingDays <= 7) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  const getProgressPercentage = (entry: DryFoodEntry & { 
    remainingDays: number; 
    remainingWeight: number; 
    depletionDate: string;
  }) => {
    const totalWeight = parseFloat(entry.bagWeight);
    if (totalWeight === 0) return 0;
    return Math.max(0, Math.min(100, (entry.remainingWeight / totalWeight) * 100));
  };

  const validActiveEntries = entries.filter(isValidActiveEntry);
  if (validActiveEntries.length === 0 && finishedEntries.length === 0) {
    return null;
  }

  return (
    <>
      {/* Active Entries Section */}
      {validActiveEntries.length > 0 && (
        <div className="grid gap-4">
          {validActiveEntries.map((entry) => {
            const progressPercentage = getProgressPercentage(entry);
  
            return (
              <Card key={entry.id} className="relative">
                <CardHeader className="pb-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                  <SectionTitle>
                    {entry.brandName && entry.productName
                        ? `${entry.brandName} - ${entry.productName}`
                        : entry.brandName || entry.productName || 'Dry Food'}
                    </SectionTitle>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Weight className="h-4 w-4" />
                        {entry.bagWeight} {entry.bagWeightUnit}
                      </span>
                      <span className="flex items-center gap-1">
                        <Utensils className="h-4 w-4" />
                        {entry.dailyAmount} {entry.dryDailyAmountUnit}/day
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateForDisplay(entry.dateStarted)}
                      </span>
                    </div>
                  </div>
                  {/* Actions never shrinks */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusSection(entry)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setMarkingFinishedEntry(entry)}>
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Mark As Finished
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingEntry(entry)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <StatLabel>Remaining</StatLabel>
                      <StatValue>{formatRemainingWeight(entry.remainingWeight)} {entry.bagWeightUnit}</StatValue>
                    </div>
                    <div>
                      <StatLabel>Days Left</StatLabel>
                      <StatValue>{entry.remainingDays > 0 ? entry.remainingDays : 0}</StatValue>
                    </div>
                    <div>
                      <StatLabel>Depletion Date</StatLabel>
                      <StatValue>{formatDateForDisplay(entry.depletionDate)}</StatValue>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <StatLabel>Progress</StatLabel>
                      <MutedText>{progressPercentage.toFixed(1)}% remaining</MutedText>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progressPercentage > 50 
                            ? 'bg-green-600' 
                            : progressPercentage > 25 
                            ? 'bg-yellow-600' 
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
  
      {/* History Section - Always show if there are finished entries */}
      {finishedEntries.length > 0 && (
        <FoodHistorySection 
          entries={finishedEntries}
          foodType="dry"
          onEditFinishDate={onUpdateFinishDate}
          onDelete={onDelete}
        />
      )}
  
      {/* Edit Dialog */}
      <ResponsiveDialog
        open={!!editingEntry}
        onOpenChange={() => setEditingEntry(null)}
        title="Edit Dry Food Entry"
        description="Update the details for this dry food entry."
      >
        {editingEntry && (
          <DryFoodForm
            initialData={{
              brandName: editingEntry.brandName || '',
              productName: editingEntry.productName || '',
              bagWeight: editingEntry.bagWeight,
              bagWeightUnit: editingEntry.bagWeightUnit,
              dailyAmount: editingEntry.dailyAmount,
              dryDailyAmountUnit: editingEntry.dryDailyAmountUnit,
              dateStarted: editingEntry.dateStarted,
            }}
            onSubmit={handleUpdate}
            isLoading={isLoading}
            submitLabel="Update Dry Food"
          />
        )}
      </ResponsiveDialog>

      {markingFinishedEntry && (
        <MarkAsFinishedDialog
          entry={markingFinishedEntry}
          isOpen={!!markingFinishedEntry}
          onClose={() => setMarkingFinishedEntry(null)}
          onConfirm={onMarkAsFinished}
          isLoading={isLoading}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dry Food Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dry food entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};