import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';
import { formatDateForDisplay } from '@/lib/utils/date-formatting';
import { getFeedingStatusColor, formatFeedingStatusMessage, calculateExpectedDays } from '@/lib/utils/food-formatting';
import { EditFinishDateDialog } from './EditFinishDateDialog';
import { DeleteFoodEntryDialog } from './DeleteFoodEntryDialog';
import { MutedText, EntryTitle } from '@/components/ui/typography';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getFallbackDateTimeLocale } from '@/lib/utils/locale';
import { FoodUnitLabel } from './FoodUnitLabel';
import { convertFoodWeight } from '@/lib/validations/pet';
import { formatRemainingWeight } from '@/lib/utils/food-formatting';
import { useTranslation } from 'react-i18next';
import { FOOD_HISTORY_TITLE_KEYS, FOOD_TYPE_TAB_KEYS } from '@/i18n/enum-keys';

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
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DryFoodEntry | WetFoodEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<DryFoodEntry | WetFoodEntry | null>(null);

  const { dateTimeLocale, units } = usePreferencesContext();
  const displayLocale = dateTimeLocale ?? getFallbackDateTimeLocale();
  const dailyAmountUnit = foodType === 'dry' ? 'grams' : (units?.wetFoodUnit ?? 'grams');
  const bagWeightUnit = units?.bagWeightUnit ?? 'kg';

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
                <div key={entry.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
              
                  {/* Title row — name + status badge stacked, not inline */}
                  <div className="flex items-center gap-2 mb-1">
                  <EntryTitle>
                    {entry.brandName && entry.productName
                      ? `${entry.brandName} - ${entry.productName}`
                      : entry.brandName || entry.productName || t(FOOD_TYPE_TAB_KEYS[foodType])}
                  </EntryTitle>
                  </div>
              
                  {/* Status badge on its own line */}
                  {entry.feedingStatus && entry.actualDaysElapsed && (
                    <Badge
                      variant="outline"
                      className={`text-xs mb-1 ${getFeedingStatusColor(entry.feedingStatus)}`}
                    >
                    {formatFeedingStatusMessage(entry, dailyAmountUnit, t)}
                    </Badge>
                  )}
              
                  {/* Metadata chips — flex-wrap so they can flow to next line */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {foodType === 'dry' ? (
                      <>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {formatRemainingWeight(convertFoodWeight(parseFloat((entry as DryFoodEntry).bagWeight), 'grams', bagWeightUnit))} <FoodUnitLabel unit={bagWeightUnit} />
                        </span>
                        <span className="flex items-center gap-1">
                          <Utensils className="h-3 w-3" />
                          {(entry as DryFoodEntry).dailyAmount} <FoodUnitLabel unit="grams" />{t('food.shared.perDaySuffix')}
                          </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {(entry as WetFoodEntry).numberOfUnits}×{formatRemainingWeight(convertFoodWeight(parseFloat((entry as WetFoodEntry).weightPerUnit), 'grams', dailyAmountUnit))} <FoodUnitLabel unit={dailyAmountUnit} />
                        </span>
                        <span className="flex items-center gap-1">
                          <Utensils className="h-3 w-3" />
                          {formatRemainingWeight(convertFoodWeight(parseFloat((entry as WetFoodEntry).dailyAmount), 'grams', dailyAmountUnit))} <FoodUnitLabel unit={dailyAmountUnit} />{t('food.shared.perDaySuffix')}
                        </span>
                      </>
                    )}
                   <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('food.tracker.expectedDaysLabel', { count: calculateExpectedDays(entry) })}
                  </span>
                  {entry.actualDaysElapsed && (
                    <span className="flex items-center gap-1">
                      <Hourglass className="h-3 w-3" />
                      {t('food.tracker.actualDaysLabel', { count: entry.actualDaysElapsed })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('food.tracker.startedLabel', { date: formatDateForDisplay(entry.dateStarted, displayLocale) })}
                  </span>
                  {entry.dateFinished && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {t('food.tracker.finishedLabel', { date: formatDateForDisplay(entry.dateFinished, displayLocale) })}
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
                        {t('food.editFinishDate.title')}
                      </DropdownMenuItem>
                      {onReorder && (
                        <DropdownMenuItem onClick={() => onReorder(entry)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {t('food.tracker.reorderLabel')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingEntry(entry)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('common.actions.delete')}
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