'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CheckCircle
} from 'lucide-react';
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';
import { formatDateForDisplay } from '@/lib/validations/food';
import { getFeedingStatusColor, formatFeedingStatusMessage, calculateExpectedDays } from '@/lib/utils/food-formatting';
import { EditFinishDateDialog } from './EditFinishDateDialog';
import { DeleteFoodEntryDialog } from './DeleteFoodEntryDialog';

interface FoodHistorySectionProps {
  entries: (DryFoodEntry | WetFoodEntry)[];
  foodType: 'dry' | 'wet';
  onReorder?: (entry: DryFoodEntry | WetFoodEntry) => void;
  onEditFinishDate: (foodId: string, dateFinished: string) => Promise<DryFoodEntry | WetFoodEntry | null>;
  onDelete: (foodId: string) => Promise<boolean>;
  isLoading?: boolean;
}

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

  if (entries.length === 0) return null;

  return (
    <>
      <Card className="mt-6 border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent {foodType === 'dry' ? 'Dry' : 'Wet'} Food History ({entries.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
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
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">Finished</Badge>
                      <h4 className="font-medium text-sm">
                        {entry.brandName && entry.productName 
                          ? `${entry.brandName} - ${entry.productName}`
                          : entry.brandName || entry.productName || `${foodType === 'dry' ? 'Dry' : 'Wet'} Food`}
                      </h4>
                      {entry.feedingStatus && entry.actualDaysElapsed && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getFeedingStatusColor(entry.feedingStatus)}`}
                        >
                          {formatFeedingStatusMessage(entry)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                  
                  <div className="flex gap-2 ml-4">
                    {/* Edit finish date button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingEntry(entry)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                      title="Edit finish date"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    {/* Delete button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingEntry(entry)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                      title="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    {onReorder && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReorder(entry)}
                        disabled={isLoading}
                        className="h-8"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reorder
                      </Button>
                    )}
                  </div>
                </div>
              ))}
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