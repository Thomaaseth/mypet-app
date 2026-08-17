import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { AntiParasiteForm } from './AntiParasiteForm';
import type {
  AntiParasiteTreatment,
  AntiParasiteTreatmentFormData,
} from '@/types/anti-parasite-treatments';
import { ANTI_PARASITE_CATEGORY_KEYS } from '@/i18n/enum-keys';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';
import { useTranslation } from 'react-i18next';
import type { AntiParasiteCategory } from '@/lib/validations/anti-parasite-treatment';
import { cn } from '@/lib/utils';
import { getTodayDateString } from '@/lib/utils/date-formatting';

const PAGE_SIZE = 5;

interface AntiParasiteHistoryListProps {
  treatments: AntiParasiteTreatment[];
  onUpdateTreatment: (
    treatmentId: string,
    data: AntiParasiteTreatmentFormData,
  ) => Promise<AntiParasiteTreatment | null>;
  onDeleteTreatment: (treatmentId: string) => Promise<boolean>;
  isLoading?: boolean;
  isHistoryOpen: boolean;
}

export default function AntiParasiteHistoryList({
  treatments,
  onUpdateTreatment,
  onDeleteTreatment,
  isLoading = false,
  isHistoryOpen,
}: AntiParasiteHistoryListProps) {
  const { t } = useTranslation();
  const [editingTreatment, setEditingTreatment] = useState<AntiParasiteTreatment | null>(null);
  const [deletingTreatment, setDeletingTreatment] = useState<AntiParasiteTreatment | null>(null);
  const { formatDate } = useDateTimeFormatters();

  // Server already returns newest-first; defensive client sort for parity.
  const sortedTreatments = [...treatments].sort(
    (a, b) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime(),
  );
  const today = getTodayDateString();

  const { currentPage, totalPages, paginatedItems, goToNextPage, goToPreviousPage, resetPage } =
    usePagination(sortedTreatments, PAGE_SIZE);

  useEffect(() => {
    if (!isHistoryOpen) {
      resetPage();
    }
  }, [isHistoryOpen, resetPage]);

  const handleEditSubmit = async (data: AntiParasiteTreatmentFormData) => {
    if (!editingTreatment) return null;
    const result = await onUpdateTreatment(editingTreatment.id, data);
    if (result) {
      setEditingTreatment(null);
    }
    return result;
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTreatment) return;
    const success = await onDeleteTreatment(deletingTreatment.id);
    if (success) {
      setDeletingTreatment(null);
    }
  };

// Category => solid app-theme color
const CATEGORY_BADGE_CLASS: Record<AntiParasiteCategory, string> = {
  fleas_ticks: 'border-accent text-accent',
  worms: 'border-secondary text-secondary',
  heartworm: 'border-primary text-primary',
};

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('antiParasite.list.productColumn')}</TableHead>
            <TableHead>{t('antiParasite.list.dateColumn')}</TableHead>
            <TableHead>{t('antiParasite.list.protectedUntilColumn')}</TableHead>
            <TableHead className="text-right">
              <span className="hidden sm:inline">{t('antiParasite.list.actionsColumn')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((treatment) => (
            <TableRow key={treatment.id}>
              <TableCell className="font-medium">
              <div className="space-y-1.5">
                <div>{treatment.productName}</div>
                <div className="flex flex-wrap gap-1">
                  {treatment.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="outline"
                      className={cn('text-xs', CATEGORY_BADGE_CLASS[category])}
                    >
                      {t(ANTI_PARASITE_CATEGORY_KEYS[category])}
                    </Badge>
                  ))}
                </div>
              </div>
            </TableCell>
              <TableCell>{formatDate(treatment.dateAdministered)}</TableCell>
              <TableCell className={cn(treatment.expiryDate < today ? 'text-muted-foreground' : 'font-display')}>
                {formatDate(treatment.expiryDate)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={isLoading}
                      aria-label={t('antiParasite.list.actionsAria', {
                        product: treatment.productName,
                      })}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingTreatment(treatment)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      {t('common.actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeletingTreatment(treatment)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
      />

      {/* Edit — full form pre-filled with the whole treatment */}
      <ResponsiveDialog
        open={!!editingTreatment}
        onOpenChange={(open) => !open && setEditingTreatment(null)}
        title={t('antiParasite.list.editDialogTitle')}
        description={t('antiParasite.list.editDialogDescription')}
      >
        {editingTreatment && (
          <AntiParasiteForm
            treatment={editingTreatment}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingTreatment(null)}
            isLoading={isLoading}
            submitLabel={t('antiParasite.list.editSubmitLabel')}
          />
        )}
      </ResponsiveDialog>

      <AlertDialog open={!!deletingTreatment} onOpenChange={(open) => !open && setDeletingTreatment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('antiParasite.list.deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('antiParasite.list.deleteConfirmation', {
                product: deletingTreatment?.productName ?? '',
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
              {t('antiParasite.list.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}