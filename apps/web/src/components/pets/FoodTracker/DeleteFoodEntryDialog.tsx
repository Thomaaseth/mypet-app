'use client';

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
  if (!entry) return null;

  const handleConfirm = async () => {
    const success = await onConfirm(entry.id);
    if (success) {
      onClose();
    }
  };

  const entryName = entry.brandName && entry.productName 
    ? `${entry.brandName} - ${entry.productName}`
    : entry.brandName || entry.productName || `${entry.foodType === 'dry' ? 'Dry' : 'Wet'} Food`;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Food Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete <strong>{entryName}</strong>? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Deleting...' : 'Delete Permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}