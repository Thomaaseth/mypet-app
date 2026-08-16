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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import type { AntiParasiteTreatment } from '@/types/anti-parasite-treatments';
import { ANTI_PARASITE_CATEGORY_KEYS } from '@/i18n/enum-keys';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 5;

interface AntiParasiteHistoryListProps {
  treatments: AntiParasiteTreatment[];
  onDeleteTreatment: (treatmentId: string) => Promise<boolean>;
  isLoading?: boolean;
  isHistoryOpen: boolean;
}

export default function AntiParasiteHistoryList({
  treatments,
  onDeleteTreatment,
  isLoading = false,
  isHistoryOpen,
}: AntiParasiteHistoryListProps) {
  const { t } = useTranslation();
  const [deletingTreatment, setDeletingTreatment] = useState<AntiParasiteTreatment | null>(null);
  const { formatDate } = useDateTimeFormatters();

  // Server already returns newest-first; defensive client sort for parity.
  const sortedTreatments = [...treatments].sort(
    (a, b) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime(),
  );

  const { currentPage, totalPages, paginatedItems, goToNextPage, goToPreviousPage, resetPage } =
    usePagination(sortedTreatments, PAGE_SIZE);

  useEffect(() => {
    if (!isHistoryOpen) {
      resetPage();
    }
  }, [isHistoryOpen, resetPage]);
  const handleDeleteConfirm = async () => {
    if (!deletingTreatment) return;
    const success = await onDeleteTreatment(deletingTreatment.id);
    if (success) {
      setDeletingTreatment(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('antiParasite.list.productColumn')}</TableHead>
            <TableHead>{t('antiParasite.list.categoriesColumn')}</TableHead>
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
              <TableCell className="font-medium">{treatment.productName}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {treatment.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {t(ANTI_PARASITE_CATEGORY_KEYS[category])}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{formatDate(treatment.dateAdministered)}</TableCell>
              <TableCell className="font-display">{formatDate(treatment.expiryDate)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  disabled={isLoading}
                  onClick={() => setDeletingTreatment(treatment)}
                  aria-label={t('antiParasite.list.deleteAria', { product: treatment.productName })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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

      <AlertDialog open={!!deletingTreatment} onOpenChange={() => setDeletingTreatment(null)}>
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