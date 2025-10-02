'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Loader2 } from 'lucide-react';
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';

interface EditFinishDateDialogProps {
  entry: DryFoodEntry | WetFoodEntry;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (foodId: string, dateFinished: string) => Promise<DryFoodEntry | WetFoodEntry | null>;
}

export function EditFinishDateDialog({ entry, isOpen, onClose, onUpdate }: EditFinishDateDialogProps) {
  const [dateFinished, setDateFinished] = useState(entry.dateFinished || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = entry.dateStarted;
  const maxDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dateFinished) {
      setError('Please select a finish date');
      return;
    }

    if (dateFinished < minDate) {
      setError('Finish date cannot be before start date');
      return;
    }

    if (dateFinished > maxDate) {
      setError('Finish date cannot be in the future');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onUpdate(entry.id, dateFinished);
      if (result) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Finish Date
          </DialogTitle>
          <DialogDescription>
            Update when this food was actually finished. Must be between start date and today.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dateStarted">Start Date (Reference)</Label>
              <Input
                id="dateStarted"
                type="date"
                value={entry.dateStarted}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dateFinished">Finish Date *</Label>
              <Input
                id="dateFinished"
                type="date"
                value={dateFinished}
                onChange={(e) => setDateFinished(e.target.value)}
                min={minDate}
                max={maxDate}
                required
              />
              <p className="text-xs text-muted-foreground">
                Between {minDate} and {maxDate}
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Date
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}