import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { ErrorText, HelperText } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';
import { getTodayDateString } from '@/lib/utils/date-formatting';

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
  const maxDate = getTodayDateString();

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
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Edit Finish Date"
      description="Update when this food was actually finished. Must be between start date and today."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <HelperText>Between {minDate} and {maxDate}</HelperText>
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Date
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}