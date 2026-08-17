import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
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
import type { DryFoodEntry, WetFoodEntry, FoodType } from '@/types/food';
import {
  getFeedingStatusColor,
  formatFeedingStatusMessage,
  calculateExpectedDays,
  formatRemainingWeight,
} from '@/lib/utils/food-formatting';
import { EntryTitle } from '@/components/ui/typography';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';
import { FoodUnitLabel } from './FoodUnitLabel';
import { convertFoodWeight } from '@/lib/validations/pet';
import { useTranslation } from 'react-i18next';
import { FOOD_TYPE_TAB_KEYS } from '@/i18n/enum-keys';

interface FoodHistoryEntryProps {
  entry: DryFoodEntry | WetFoodEntry;
  foodType: FoodType;
  onReorder?: (entry: DryFoodEntry | WetFoodEntry) => void;
  onEditClick: (entry: DryFoodEntry | WetFoodEntry) => void;
  onDeleteClick: (entry: DryFoodEntry | WetFoodEntry) => void;
  isLoading?: boolean;
}

export function FoodHistoryEntry({
  entry,
  foodType,
  onReorder,
  onEditClick,
  onDeleteClick,
  isLoading = false,
}: FoodHistoryEntryProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const { units } = usePreferencesContext();
  const { formatDate } = useDateTimeFormatters();

  const dailyAmountUnit = foodType === 'dry' ? 'grams' : (units?.wetFoodUnit ?? 'grams');
  const bagWeightUnit = units?.bagWeightUnit ?? 'kg';

  const title =
    entry.brandName && entry.productName
      ? `${entry.brandName} - ${entry.productName}`
      : entry.brandName || entry.productName || t(FOOD_TYPE_TAB_KEYS[foodType]);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="p-3 bg-muted/30 rounded-lg"
    >
      {/* Collapsed row — always visible: title + status badge, then chevron + menu */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <EntryTitle>{title}</EntryTitle>
          </div>

          {entry.feedingStatus && entry.actualDaysElapsed && (
            <Badge
              variant="outline"
              className={`text-xs ${getFeedingStatusColor(entry.feedingStatus)}`}
            >
              {formatFeedingStatusMessage(entry, dailyAmountUnit, t)}
            </Badge>
          )}
        </div>

        <div className="ml-4 flex-shrink-0 flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditClick(entry)}>
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
                onClick={() => onDeleteClick(entry)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded — the rest of the entry's metadata */}
      <CollapsibleContent>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground border-t pt-3 mt-3">
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
            {t('food.tracker.startedLabel', { date: formatDate(entry.dateStarted) })}
          </span>
          {entry.dateFinished && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {t('food.tracker.finishedLabel', { date: formatDate(entry.dateFinished) })}
            </span>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}