'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit2, Trash2, Calendar } from 'lucide-react';
import { formatDateForDisplay } from '@/lib/validations/weight';
import WeightForm from './WeightForm';
import type { WeightEntry, WeightFormData } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';

interface WeightListProps {
  weightEntries: WeightEntry[];
  weightUnit: WeightUnit;
  onUpdateEntry: (weightId: string, data: Partial<WeightFormData>) => Promise<WeightEntry | null>;
  onDeleteEntry: (weightId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export default function WeightList({ 
  weightEntries, 
  weightUnit, 
  onUpdateEntry, 
  onDeleteEntry,
  isLoading = false 
}: WeightListProps) {
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<WeightEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Sort entries by date (newest first for the table)
  const sortedEntries = [...weightEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

  // If no entries, show empty state
  if (weightEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weight History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>No weight entries yet. Add your first entry above!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weight History
            </div>
            <span className="text-sm font-normal text-muted-foreground">
              {weightEntries.length} {weightEntries.length === 1 ? 'entry' : 'entries'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Weight ({weightUnit})</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {formatDateForDisplay(entry.date)}
                  </TableCell>
                  <TableCell>
                    {entry.weight} {weightUnit}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(entry)}
                        disabled={isLoading}
                      >
                        <Edit2 className="h-4 w-4" />
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Weight Entry</DialogTitle>
            <DialogDescription>
              Update the weight and date for this entry.
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <WeightForm
              weightUnit={weightUnit}
              weightEntry={editingEntry}
              onSubmit={handleEditSubmit}
              onCancel={handleEditCancel}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Weight Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this weight entry from{' '}
              {deletingEntry && formatDateForDisplay(deletingEntry.date)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
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