import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { AppointmentWithRelations } from '@/types/appointments';
import { formatDateForDisplay, formatTimeForDisplay } from '@/lib/validations/appointments';

interface EditNotesDialogProps {
  appointment: AppointmentWithRelations | null;
  isLoading: boolean;
  error?: string;
  onSubmit: (appointmentId: string, visitNotes: string) => Promise<void>;
  onCancel: () => void;
}

export default function EditNotesDialog({
  appointment,
  isLoading,
  error,
  onSubmit,
  onCancel,
}: EditNotesDialogProps) {
  const [visitNotes, setVisitNotes] = useState(appointment?.visitNotes || '');
  const [localError, setLocalError] = useState<string | null>(null);

  if (!appointment) return null;

  const displayDate = formatDateForDisplay(appointment.appointmentDate);
  const displayTime = formatTimeForDisplay(appointment.appointmentTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Client-side validation
    if (visitNotes.length > 1000) {
      setLocalError('Visit notes must be less than 1000 characters');
      return;
    }

    try {
      await onSubmit(appointment.id, visitNotes);
    } catch (err) {
      // Error handled by parent
    }
  };

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Visit Notes</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>Update notes from this vet visit</p>
              <div className="text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Pet:</span> {appointment.pet.name}
                </p>
                <p>
                  <span className="font-medium">Vet:</span>{' '}
                  {appointment.veterinarian.clinicName || appointment.veterinarian.vetName}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {displayDate} at {displayTime}
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || localError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || localError}</AlertDescription>
            </Alert>
          )}

          {/* Reason for Visit (read-only) */}
          {appointment.reasonForVisit && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Reason for Visit (read-only)</Label>
              <div className="text-sm border rounded-md p-3 bg-muted/50 text-muted-foreground">
                {appointment.reasonForVisit}
              </div>
            </div>
          )}

          {/* Visit Notes (editable) */}
          <div className="space-y-2">
            <Label htmlFor="visitNotes">Visit Notes</Label>
            <Textarea
              id="visitNotes"
              placeholder="Add notes from the vet visit..."
              rows={6}
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              disabled={isLoading}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {visitNotes.length}/1000 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}