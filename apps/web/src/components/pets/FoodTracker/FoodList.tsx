'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Calendar, Package, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDateForDisplay, formatAmount, getFoodTypeColor } from '@/lib/validations/food';
import FoodForm from './FoodForm';
import type { FoodEntry, FoodFormData } from '@/types/food';
import { FOOD_TYPE_LABELS } from '@/types/food';

interface FoodListProps {
  foodEntries: FoodEntry[];
  onUpdateEntry: (foodId: string, data: Partial<FoodFormData>) => Promise<FoodEntry | null>;
  onDeleteEntry: (foodId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export default function FoodList({ 
  foodEntries, 
  onUpdateEntry, 
  onDeleteEntry, 
  isLoading = false 
}: FoodListProps) {
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<FoodEntry | null>(null);

  const handleUpdateEntry = async (data: FoodFormData): Promise<FoodEntry | null> => {
    if (!editingEntry) return null;
    
    const result = await onUpdateEntry(editingEntry.id, data);
    if (result) {
      setEditingEntry(null);
    }
    return result;
  };

  const handleDeleteEntry = async () => {
    if (!deletingEntry) return;
    
    const success = await onDeleteEntry(deletingEntry.id);
    if (success) {
      setDeletingEntry(null);
    }
  };

  const getStatusColor = (entry: FoodEntry) => {
    if (entry.remainingDays <= 0) {
      return 'bg-red-50 border-red-200';
    } else if (entry.remainingDays <= 3) {
      return 'bg-orange-50 border-orange-200';
    } else if (entry.remainingDays <= 7) {
      return 'bg-yellow-50 border-yellow-200';
    }
    return 'bg-green-50 border-green-200';
  };

  const getStatusIcon = (entry: FoodEntry) => {
    if (entry.remainingDays <= 0) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    } else if (entry.remainingDays <= 3) {
      return <Clock className="h-4 w-4 text-orange-600" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getStatusText = (entry: FoodEntry) => {
    if (entry.remainingDays <= 0) {
      return 'Finished';
    } else if (entry.remainingDays <= 3) {
      return 'Low Stock';
    } else if (entry.remainingDays <= 7) {
      return 'Running Low';
    }
    return 'Good Stock';
  };

  const getDisplayName = (entry: FoodEntry) => {
    if (entry.brandName && entry.productName) {
      return `${entry.brandName} - ${entry.productName}`;
    }
    if (entry.brandName) return entry.brandName;
    if (entry.productName) return entry.productName;
    return `${FOOD_TYPE_LABELS[entry.foodType]} Food`;
  };

  if (foodEntries.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No food entries found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {foodEntries.map((entry) => (
          <Card key={entry.id} className={`transition-all ${getStatusColor(entry)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getFoodTypeColor(entry.foodType)}>
                      {FOOD_TYPE_LABELS[entry.foodType]}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(entry)}
                      <span className="text-sm font-medium">
                        {getStatusText(entry)}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">
                    {getDisplayName(entry)}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingEntry(entry)}
                    disabled={isLoading}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingEntry(entry)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span>Total Weight</span>
                  </div>
                  <p className="font-medium">
                    {formatAmount(entry.bagWeight, entry.bagWeightUnit)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Daily Amount</span>
                  </div>
                  <p className="font-medium">
                    {formatAmount(entry.dailyAmount, entry.dailyAmountUnit)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Days Remaining</span>
                  </div>
                  <p className="font-medium">
                    {entry.remainingDays > 0 ? `${entry.remainingDays} days` : 'Finished'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Runs Out</span>
                  </div>
                  <p className="font-medium">
                    {entry.remainingDays > 0 
                      ? formatDateForDisplay(entry.depletionDate)
                      : 'Now'
                    }
                  </p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Purchased: {formatDateForDisplay(entry.datePurchased)}</span>
                  <span>Remaining: {entry.remainingWeight.toFixed(1)} {entry.bagWeightUnit}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Food Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Food Entry</DialogTitle>
            <DialogDescription>
              Update the details of this food entry.
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <FoodForm
              initialData={{
                foodType: editingEntry.foodType,
                brandName: editingEntry.brandName || '',
                productName: editingEntry.productName || '',
                bagWeight: editingEntry.bagWeight,
                bagWeightUnit: editingEntry.bagWeightUnit,
                dailyAmount: editingEntry.dailyAmount,
                dailyAmountUnit: editingEntry.dailyAmountUnit,
                datePurchased: editingEntry.datePurchased,
              }}
              onSubmit={handleUpdateEntry}
              onCancel={() => setEditingEntry(null)}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Food Entry Confirmation */}
      <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this food entry? This action cannot be undone.
              {deletingEntry && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>{getDisplayName(deletingEntry)}</strong>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEntry}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}