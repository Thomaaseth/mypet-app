// apps/web/src/components/pets/FoodTracker/DryFoodList.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Edit, Trash2, Calendar, Weight, Utensils } from 'lucide-react';
import { DryFoodForm } from './DryFoodForm';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';
import { formatDateForDisplay } from '@/lib/validations/food';

interface DryFoodListProps {
  entries: DryFoodEntry[];
  onUpdate: (foodId: string, data: Partial<DryFoodFormData>) => Promise<DryFoodEntry | null>;
  onDelete: (foodId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export function DryFoodList({ entries, onUpdate, onDelete, isLoading = false }: DryFoodListProps) {
  const [editingEntry, setEditingEntry] = useState<DryFoodEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<DryFoodEntry | null>(null);

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

  const getStatusBadge = (entry: DryFoodEntry) => {
    if (entry.remainingDays <= 0) {
      return <Badge variant="destructive">Finished</Badge>;
    } else if (entry.remainingDays <= 7) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Weight className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No dry food entries yet.</p>
            <p className="text-sm">Add your first bag of dry food to start tracking!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {entries.map((entry) => (
          <Card key={entry.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {entry.brandName && entry.productName 
                      ? `${entry.brandName} - ${entry.productName}`
                      : entry.brandName || entry.productName || 'Dry Food'}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Weight className="h-4 w-4" />
                      {entry.bagWeight} {entry.bagWeightUnit}
                    </span>
                    <span className="flex items-center gap-1">
                      <Utensils className="h-4 w-4" />
                      {entry.dailyAmount} {entry.dryDailyAmountUnit}/day
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateForDisplay(entry.datePurchased)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(entry)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingEntry(entry)}
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingEntry(entry)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Remaining</p>
                  <p className="text-lg font-semibold">
                    {entry.remainingWeight.toFixed(1)} {entry.bagWeightUnit}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Days Left</p>
                  <p className="text-lg font-semibold">
                    {entry.remainingDays > 0 ? entry.remainingDays : 0}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Depletion Date</p>
                  <p className="text-lg font-semibold">
                    {formatDateForDisplay(entry.depletionDate)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Progress</p>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.max(0, Math.min(100, (entry.remainingWeight / parseFloat(entry.bagWeight)) * 100))}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Dry Food Entry</DialogTitle>
            <DialogDescription>
              Update the details for this dry food entry.
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <DryFoodForm
              initialData={{
                brandName: editingEntry.brandName || '',
                productName: editingEntry.productName || '',
                bagWeight: editingEntry.bagWeight,
                bagWeightUnit: editingEntry.bagWeightUnit,
                dailyAmount: editingEntry.dailyAmount,
                dryDailyAmountUnit: editingEntry.dryDailyAmountUnit,
                datePurchased: editingEntry.datePurchased,
              }}
              onSubmit={handleUpdate}
              isLoading={isLoading}
              submitLabel="Update Dry Food"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dry Food Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dry food entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}