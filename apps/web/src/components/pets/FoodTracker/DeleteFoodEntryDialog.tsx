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
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';
import { useTranslation } from 'react-i18next';
import { FOOD_TYPE_TAB_KEYS } from '@/i18n/enum-keys';

interface DeleteFoodEntryDialogProps {
  entry: DryFoodEntry | WetFoodEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (foodId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export function DeleteFoodEntryDialog({ 
  entry, 
  isOpen, 
  onClose, 
  onConfirm,
  isLoading = false 
}: DeleteFoodEntryDialogProps) {
  const { t } = useTranslation();

  if (!entry) return null;

  const handleConfirm = async () => {
    const success = await onConfirm(entry.id);
    if (success) {
      onClose();
    }
  };

  const entryName = entry.brandName && entry.productName 
    ? `${entry.brandName} - ${entry.productName}`
    : entry.brandName || entry.productName || t(FOOD_TYPE_TAB_KEYS[entry.foodType]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
         <AlertDialogTitle>{t('food.tracker.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('food.tracker.deleteConfirmDescription', { name: entryName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
        <AlertDialogCancel disabled={isLoading}>{t('common.actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading ? t('food.tracker.deleting') : t('food.tracker.deletePermanently')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}