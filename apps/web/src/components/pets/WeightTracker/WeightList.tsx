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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDateForDisplay } from '@/lib/utils/date-formatting';
import WeightForm from './WeightForm';
import type { WeightEntry, WeightFormData } from '@/types/weights';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { convertWeight, formatWeight } from '@/lib/validations/pet';
import { getFallbackDateTimeLocale, getFallbackUnitSystem } from '@/lib/utils/locale';
import { getUnitsForSystem } from '@/shared/validations/units';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 5;

interface WeightListProps {
  animalType: 'cat' | 'dog';
  weightEntries: WeightEntry[];
  onUpdateEntry: (weightId: string, data: Partial<WeightFormData>) => Promise<WeightEntry | null>;
  onDeleteEntry: (weightId: string) => Promise<boolean>;
  isLoading?: boolean;
  isHistoryOpen: boolean;
}

export default function WeightList({ 
  animalType,
  weightEntries, 
  onUpdateEntry, 
  onDeleteEntry,
  isLoading = false,
  isHistoryOpen,
}: WeightListProps) {
  const { t } = useTranslation();
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<WeightEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { units, dateTimeLocale } = usePreferencesContext();
  const weightUnit = units?.weightUnit ?? getUnitsForSystem(getFallbackUnitSystem()).weightUnit;
  const displayLocale = dateTimeLocale ?? getFallbackDateTimeLocale();

  // Sort entries by date (newest first for the table)
  const sortedEntries = [...weightEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const { currentPage, totalPages, paginatedItems, goToNextPage, goToPreviousPage, resetPage } =
  usePagination(sortedEntries, PAGE_SIZE);

  useEffect(() => {
    if (!isHistoryOpen) {
      resetPage()
    }
  }, [isHistoryOpen, resetPage]);

  const handleEditClick = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: WeightFormData) => {
    if (!editingEntry) return null;
    
    const result = await onUpdateEntry(editingEntry.id, data);
    if (result) {
      setIsEditDialogOpen(false);
      setEditingEntry(null);
    }
    return result;
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEntry) return;
    
    const success = await onDeleteEntry(deletingEntry.id);
    if (success) {
      setDeletingEntry(null);
    }
  };



  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('weights.form.dateLabel')}</TableHead>
            <TableHead>{t('weights.form.weightLabel')}</TableHead>
            <TableHead className="text-right">
            <span className="hidden sm:inline">{t('weights.list.actionsColumn')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((entry) => {
            const displayWeight = formatWeight(convertWeight(parseFloat(entry.weight), 'kg', weightUnit));
            return (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">
                {formatDateForDisplay(entry.date, displayLocale)}
              </TableCell>
              <TableCell className='font-display'>
                {displayWeight} {weightUnit}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(entry)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      {t('common.actions.edit')}
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
              </TableCell>
            </TableRow>
          )
        })}
        </TableBody>
      </Table>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
      />

      {/* Edit Dialog */}
      <ResponsiveDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title={t('weights.list.editDialogTitle')}
        description={t('weights.list.editDialogDescription')}
      >
        {editingEntry && (
          <WeightForm
            animalType={animalType}
            weightEntry={editingEntry}
            onSubmit={handleEditSubmit}
            onCancel={handleEditCancel}
            isLoading={isLoading}
          />
        )}
      </ResponsiveDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
          <AlertDialogTitle>{t('weights.list.deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
            {t('weights.list.deleteConfirmation', {
              date: deletingEntry ? formatDateForDisplay(deletingEntry.date, displayLocale) : '',
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
              {t('weights.list.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}