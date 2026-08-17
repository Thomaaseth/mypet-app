import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  ChevronDown,
  ChevronRight,
  History,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { DryFoodEntry, WetFoodEntry, FoodType } from '@/types/food';
import { EditFinishDateDialog } from './EditFinishDateDialog';
import { DeleteFoodEntryDialog } from './DeleteFoodEntryDialog';
import { FoodHistoryEntry } from './FoodHistoryEntry';
import { MutedText } from '@/components/ui/typography';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useTranslation } from 'react-i18next';
import { FOOD_HISTORY_TITLE_KEYS } from '@/i18n/enum-keys';

interface FoodHistorySectionProps {
  entries: (DryFoodEntry | WetFoodEntry)[];
  foodType: FoodType;
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
  const { t } = useTranslation();

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

  const handleOpenChange = (open: boolean) => {
    if (!open) resetPage();
    setIsExpanded(open);
  };

  const { currentPage, totalPages, paginatedItems: paginatedEntries, goToNextPage, goToPreviousPage, resetPage } =
  usePagination(entries, PAGE_SIZE);

  if (entries.length === 0) return null;

  return (
    <>
      <Card>
        <Collapsible open={isExpanded} onOpenChange={handleOpenChange}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/75 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <MutedText className="font-display">
                    {t(FOOD_HISTORY_TITLE_KEYS[foodType])}
                  </MutedText>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t('food.tracker.entries', { count: entries.length })}
                  </span>
                  {isExpanded ? (
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
            <div className="space-y-3">
              {paginatedEntries.map((entry) => (
                <FoodHistoryEntry
                  key={entry.id}
                  entry={entry}
                  foodType={foodType}
                  onReorder={onReorder}
                  onEditClick={setEditingEntry}
                  onDeleteClick={setDeletingEntry}
                  isLoading={isLoading}
                />
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
        </CollapsibleContent>
      </Collapsible>
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