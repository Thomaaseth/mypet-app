import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  History, 
  RotateCcw, 
  Pencil, 
  Trash2,
  Package,
  Utensils,
  Clock,
  Hourglass,
  Calendar,
  CheckCircle,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';
import { formatDateForDisplay } from '@/lib/validations/food';
import { getFeedingStatusColor, formatFeedingStatusMessage, calculateExpectedDays } from '@/lib/utils/food-formatting';
import { EditFinishDateDialog } from './EditFinishDateDialog';
import { DeleteFoodEntryDialog } from './DeleteFoodEntryDialog';
import { MutedText, EntryTitle } from '@/components/ui/typography';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface FoodHistorySectionProps {
  entries: (DryFoodEntry | WetFoodEntry)[];
  foodType: 'dry' | 'wet';
  onReorder?: (entry: DryFoodEntry | WetFoodEntry) => void;
  onEditFinishDate: (foodId: string, dateFinished: string) => Promise<DryFoodEntry | WetFoodEntry | null>;
  onDelete: (foodId: string) => Promise<boolean>;
  isLoading?: boolean;
}

const PAGE_SIZE = 5;

export function FoodHistorySection({ 
  entries, 
  foodType, 
  onReorder, 
  onEditFinishDate, 
  onDelete,
  isLoading = false 
}: FoodHistorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DryFoodEntry | WetFoodEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<DryFoodEntry | WetFoodEntry | null>(null);

  const handleDelete = async () => {
    if (!deletingEntry) return;
    
    const success = await onDelete(deletingEntry.id);
    if (success) {
      setDeletingEntry(null);
    }
  };

  const { currentPage, totalPages, paginatedItems: paginatedEntries, goToNextPage, goToPreviousPage, resetPage } =
  usePagination(entries, PAGE_SIZE);

  if (entries.length === 0) return null;

  return (
    <>
      <Card className="mt-6 border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <MutedText className="font-display flex items-center gap-2">
            <History className="h-4 w-4" />
              Recent {foodType === 'dry' ? 'Dry' : 'Wet'} Food History ({entries.length})
            </MutedText>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(prev => {
                  if (prev) resetPage();
                  return !prev;
                });
              }}
                className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {paginatedEntries.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
              
                  {/* Title row — name + status badge stacked, not inline */}
                  <div className="flex items-center gap-2 mb-1">
                    <EntryTitle>
                      {entry.brandName && entry.productName
                        ? `${entry.brandName} - ${entry.productName}`
                        : entry.brandName || entry.productName || `${foodType === 'dry' ? 'Dry' : 'Wet'} Food`}
                    </EntryTitle>
                  </div>
              
                  {/* Status badge on its own line */}
                  {entry.feedingStatus && entry.actualDaysElapsed && (
                    <Badge
                      variant="outline"
                      className={`text-xs mb-1 ${getFeedingStatusColor(entry.feedingStatus)}`}
                    >
                      {formatFeedingStatusMessage(entry)}
                    </Badge>
                  )}
              
                  {/* Metadata chips — flex-wrap so they can flow to next line */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {foodType === 'dry' ? (
                      <>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {(entry as DryFoodEntry).bagWeight} {(entry as DryFoodEntry).bagWeightUnit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Utensils className="h-3 w-3" />
                          {(entry as DryFoodEntry).dailyAmount} {(entry as DryFoodEntry).dryDailyAmountUnit}/day
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {(entry as WetFoodEntry).numberOfUnits} × {(entry as WetFoodEntry).weightPerUnit} {(entry as WetFoodEntry).wetWeightUnit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Utensils className="h-3 w-3" />
                          {(entry as WetFoodEntry).dailyAmount} {(entry as WetFoodEntry).wetDailyAmountUnit}/day
                        </span>
                      </>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expected {calculateExpectedDays(entry)} days
                    </span>
                    {entry.actualDaysElapsed && (
                      <span className="flex items-center gap-1">
                        <Hourglass className="h-3 w-3" />
                        Actual {entry.actualDaysElapsed} days
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Started {formatDateForDisplay(entry.dateStarted)}
                    </span>
                    {entry.dateFinished && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Finished {formatDateForDisplay(entry.dateFinished)}
                      </span>
                    )}
                  </div>
                </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Finish Date
                        </DropdownMenuItem>
                        {onReorder && (
                          <DropdownMenuItem onClick={() => onReorder(entry)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reorder
                          </DropdownMenuItem>
                        )}
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
              ))}
              
              {/* Pagination */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={goToPreviousPage}
                onNext={goToNextPage}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Edit Finish Date Dialog */}
      {editingEntry && (
        <EditFinishDateDialog
          entry={editingEntry}
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          onUpdate={onEditFinishDate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingEntry && (
        <DeleteFoodEntryDialog
          entry={deletingEntry}
          isOpen={!!deletingEntry}
          onClose={() => setDeletingEntry(null)}
          onConfirm={onDelete}
          isLoading={isLoading}
        />
      )}
    </>
  );
}