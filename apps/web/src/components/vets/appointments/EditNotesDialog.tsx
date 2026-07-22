import { useState, useEffect } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { AppointmentWithRelations } from '@/types/appointments';
import { formatTimeForDisplay } from '@/lib/validations/appointments';
import { HelperText, BodyText } from '@/components/ui/typography';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getFallbackDateTimeLocale } from '@/lib/utils/locale';
import { formatDateForDisplay, LONG_DATE_DISPLAY_OPTIONS } from '@/lib/utils/date-formatting';

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
  const [visitNotes, setVisitNotes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { dateTimeLocale } = usePreferencesContext();
  const displayLocale = dateTimeLocale ?? getFallbackDateTimeLocale();

  // Update visitNotes when appointment changes
  useEffect(() => {
    if (appointment) {
      setVisitNotes(appointment.visitNotes || '');
    }
  }, [appointment]);

  if (!appointment) return null;

  const displayDate = formatDateForDisplay(appointment.appointmentDate, displayLocale, LONG_DATE_DISPLAY_OPTIONS);
  const displayTime = formatTimeForDisplay(appointment.appointmentTime, displayLocale);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Client-side validation
    if (visitNotes.length > 200) {
      setLocalError('Visit notes must be less than 200 characters');
      return;
    }

    try {
      await onSubmit(appointment.id, visitNotes);
    } catch (err) {
      // Error handled by parent
    }
  };

  return (
    <ResponsiveDialog
    open={!!appointment}
    onOpenChange={(open) => { if (!open) onCancel(); }}
    title="Edit Visit Notes"
    description="Update notes from this vet visit"
  >
    {/* Appointment context info */}
    <div className="space-y-1 -mt-2 mb-2">
      <BodyText><span className="font-bold">Pet:</span> {appointment.pet.name}</BodyText>
      <BodyText><span className="font-bold">Vet:</span> {appointment.veterinarian.clinicName || appointment.veterinarian.vetName}</BodyText>
      <BodyText><span className="font-bold">Date:</span> {displayDate} at {displayTime}</BodyText>
    </div>

    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {(error || localError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || localError}</AlertDescription>
        </Alert>
      )}

      {appointment.reasonForVisit && (
        <div className="space-y-2">
          <Label className="text-muted-foreground">Discussion Points (read-only)</Label>
          <div className="text-sm border rounded-md p-3 bg-muted/50 text-muted-foreground">
            {appointment.reasonForVisit}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="visitNotes">Visit Summary</Label>
        <Textarea
          id="visitNotes"
          placeholder="Notes and recommendations from the vet visit..."
          rows={6}
          value={visitNotes}
          onChange={(e) => setVisitNotes(e.target.value)}
          disabled={isLoading}
          className="resize-none [word-break:break-word]"
          maxLength={200}
        />
        <HelperText>{visitNotes.length}/200 characters</HelperText>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Saving...' : 'Save Notes'}
        </Button>
      </div>
    </form>
  </ResponsiveDialog>
  );
}