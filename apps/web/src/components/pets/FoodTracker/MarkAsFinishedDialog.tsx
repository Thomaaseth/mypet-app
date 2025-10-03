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

interface MarkAsFinishedDialogProps {
  entry: DryFoodEntry | WetFoodEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (foodId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export function MarkAsFinishedDialog({ 
  entry, 
  isOpen, 
  onClose, 
  onConfirm,
  isLoading = false 
}: MarkAsFinishedDialogProps) {
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
          <AlertDialogTitle>Mark Food as Finished?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure <strong>{entryName}</strong> is finished? 
            The entry will be moved to history with today's date as the finish date.
            You can always edit finished date later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Marking...' : 'Mark as Finished'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}