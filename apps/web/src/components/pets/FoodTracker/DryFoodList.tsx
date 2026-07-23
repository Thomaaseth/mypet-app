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
import { Edit2, Trash2, Calendar, Weight, Utensils, CheckSquare, MoreHorizontal, Loader2 } from 'lucide-react';
import { DryFoodForm } from './DryFoodForm';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';
import { formatDateForDisplay } from '@/lib/utils/date-formatting';
import { FoodHistorySection } from './FoodHistorySection';
import { MarkAsFinishedDialog } from './MarkAsFinishedDialog';
import { formatRemainingWeight, formatFoodQuantity } from '@/lib/utils/food-formatting';
import { StatLabel, StatValue, MutedText, SectionTitle } from '@/components/ui/typography';
import { FoodUnitLabel } from './FoodUnitLabel'
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getFallbackDateTimeLocale } from '@/lib/utils/locale';
import { convertFoodWeight } from '@/lib/validations/pet';
import { useTranslation } from 'react-i18next';
import { FOOD_TYPE_TAB_KEYS } from '@/i18n/enum-keys';

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
  const { t } = useTranslation();

  const [editingEntry, setEditingEntry] = useState<DryFoodEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<DryFoodEntry | null>(null);
  // const [markingAsFinished, setMarkingAsFinished] = useState<string | null>(null);
  const [markingFinishedEntry, setMarkingFinishedEntry] = useState<DryFoodEntry | null>(null);

  const { dateTimeLocale, units } = usePreferencesContext();
  const displayLocale = dateTimeLocale ?? getFallbackDateTimeLocale();
  const bagWeightUnit = units?.bagWeightUnit ?? 'kg';

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
      return <Badge variant="destructive">{t('food.shared.statusFinished')}</Badge>;
    } else if (entry.remainingDays <= 7) {
      return <Badge variant="secondary">{t('food.shared.statusLowStock')}</Badge>;
    } else {
      return <Badge variant="default">{t('food.shared.statusActive')}</Badge>;
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
                        : entry.brandName || entry.productName || t(FOOD_TYPE_TAB_KEYS.dry)}
                    </SectionTitle>
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
                        <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            {t('common.actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setMarkingFinishedEntry(entry)}>
                            <CheckSquare className="h-4 w-4 mr-2" />
                            {t('food.tracker.markAsFinished')}
                          </DropdownMenuItem>
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
                  <div className="flex flex-wrap @min-[280px]:flex-nowrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground min-w-0">
                  <span className="flex items-center gap-1 shrink-0">
                        <Weight className="h-4 w-4" />
                        <span>
                          {formatFoodQuantity(convertFoodWeight(parseFloat(entry.bagWeight), 'grams', bagWeightUnit).toString())}{' '} 
                          <FoodUnitLabel unit={bagWeightUnit} />
                        </span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Utensils className="h-4 w-4" />
                        <span>{formatFoodQuantity(entry.dailyAmount)} <FoodUnitLabel unit="grams" />{t('food.shared.perDaySuffix')}</span>                      
                        </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="h-4 w-4" />
                        {formatDateForDisplay(entry.dateStarted, displayLocale)}
                      </span>
                    </div>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-2 @min-[320px]:grid-cols-3 gap-6 @min-[480px]:gap-4 mb-4">
                <div>
                <StatLabel>{t('food.shared.remainingLabel')}</StatLabel>
                      <StatValue>
                        {formatRemainingWeight(convertFoodWeight(entry.remainingWeight, 'grams', bagWeightUnit))} <FoodUnitLabel unit={bagWeightUnit} />
                      </StatValue>
                     </div>
                    <div>
                    <StatLabel>{t('food.shared.daysLeftLabel')}</StatLabel>
                      <StatValue>{entry.remainingDays > 0 ? entry.remainingDays : 0}</StatValue>
                    </div>
                    <div>
                    <StatLabel>{t('food.shared.runsOutLabel')}</StatLabel>
                      <StatValue>{formatDateForDisplay(entry.depletionDate, displayLocale)}</StatValue>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progressPercentage > 50 
                          ? 'bg-secondary' 
                          : progressPercentage > 20
                          ? 'bg-accent' 
                          : 'bg-primary'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
  
      {/* History Section - Always show if there are finished entries */}
      {finishedEntries.length > 0 && (
        <div className="mt-4">
        <FoodHistorySection 
          entries={finishedEntries}
          foodType="dry"
          onEditFinishDate={onUpdateFinishDate}
          onDelete={onDelete}
        />
        </div>
      )}
      
  
      {/* Edit Dialog */}
      <ResponsiveDialog
        open={!!editingEntry}
        onOpenChange={() => setEditingEntry(null)}
        title={t('food.dry.editDialogTitle')}
        description={t('food.dry.editDialogDescription')}
      >
        {editingEntry && (
          <DryFoodForm
            dryFoodEntry={editingEntry}
            onSubmit={handleUpdate}
            onCancel={() => setEditingEntry(null)}
            isLoading={isLoading}
            submitLabel={t('food.dry.updateButton')}
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
           <AlertDialogTitle>{t('food.dry.deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('food.dry.deleteConfirmDescription', {
                name: deletingEntry?.brandName && deletingEntry?.productName
                  ? `${deletingEntry.brandName} - ${deletingEntry.productName}`
                  : deletingEntry?.brandName || deletingEntry?.productName || t('food.dry.genericFallbackName'),
              })}
            </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {t('common.actions.cancel')}
              </AlertDialogCancel>
             <AlertDialogAction 
             onClick={handleDelete} 
             disabled={isLoading} 
             className="bg-destructive text-white hover:bg-destructive/90">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t('food.tracker.deleting') : t('common.actions.delete')}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </>
  );
};