import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricLabel, MetricValue, MutedText } from '@/components/ui/typography';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AntiParasiteForm } from './AntiParasiteForm';
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';
import { useTranslation } from 'react-i18next';
import { ANTI_PARASITE_CATEGORY_KEYS } from '@/i18n/enum-keys';
import type { AntiParasiteCategory } from '@/lib/validations/anti-parasite-treatment';
import type {
  AntiParasiteTreatment,
  AntiParasiteTreatmentFormData,
} from '@/types/anti-parasite-treatments';

interface CategoryCardProps {
  category: AntiParasiteCategory;
  // The most-recent ACTIVE treatment for this category, or null if none is
  // currently active (never logged, or the latest one has expired). Derived
  // by the tracker from the isActive flag.
  activeTreatment: AntiParasiteTreatment | null;
  onUpdateTreatment: (
    treatmentId: string,
    data: AntiParasiteTreatmentFormData,
  ) => Promise<AntiParasiteTreatment | null>;
  onDeleteTreatment: (treatmentId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export function CategoryCard({
  category,
  activeTreatment,
  onUpdateTreatment,
  onDeleteTreatment,
  isLoading = false,
}: CategoryCardProps) {
  const { t } = useTranslation();
  const { formatDate } = useDateTimeFormatters();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const categoryLabel = t(ANTI_PARASITE_CATEGORY_KEYS[category]);
  const isTracked = activeTreatment !== null;

  const handleEditSubmit = async (data: AntiParasiteTreatmentFormData) => {
    if (!activeTreatment) return null;
    const result = await onUpdateTreatment(activeTreatment.id, data);
    if (result) {
      setIsEditDialogOpen(false);
    }
    return result;
  };

  const handleDeleteConfirm = async () => {
    if (!activeTreatment) return;
    const success = await onDeleteTreatment(activeTreatment.id);
    if (success) {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Card className={cn('w-full', !isTracked && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <MetricLabel>{categoryLabel}</MetricLabel>

            {isTracked ? (
              <>
                <MetricValue className="truncate">{activeTreatment.productName}</MetricValue>
                <MutedText className="text-sm">
                  {t('antiParasite.subCard.protectedUntil', {
                    date: formatDate(activeTreatment.expiryDate),
                  })}
                </MutedText>
              </>
            ) : (
              <MutedText className="text-sm">{t('antiParasite.subCard.notTracked')}</MutedText>
            )}
          </div>

          {isTracked && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  disabled={isLoading}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  {t('common.actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>

      {/* Edit — full form pre-filled with this active treatment (all its
          categories, not just this card's category) */}
      <ResponsiveDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title={t('antiParasite.subCard.editDialogTitle')}
        description={t('antiParasite.subCard.editDialogDescription')}
      >
        {activeTreatment && (
          <AntiParasiteForm
            treatment={activeTreatment}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={isLoading}
            submitLabel={t('antiParasite.subCard.editSubmitLabel')}
          />
        )}
      </ResponsiveDialog>

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('antiParasite.subCard.deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('antiParasite.subCard.deleteConfirmation', {
                product: activeTreatment?.productName ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('antiParasite.subCard.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}