import { useState, useEffect } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { AppointmentWithRelations } from '@/types/appointments';
import { HelperText, BodyText } from '@/components/ui/typography';
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';
import { LONG_DATE_DISPLAY_OPTIONS } from '@/lib/utils/date-formatting';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [visitNotes, setVisitNotes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { formatDate, formatTime } = useDateTimeFormatters();
  
  // Update visitNotes when appointment changes
  useEffect(() => {
    if (appointment) {
      setVisitNotes(appointment.visitNotes || '');
    }
  }, [appointment]);

  if (!appointment) return null;

  const displayDate = formatDate(appointment.appointmentDate, LONG_DATE_DISPLAY_OPTIONS);
  const displayTime = formatTime(appointment.appointmentTime)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Client-side validation
    if (visitNotes.length > 200) {
      setLocalError(t('appointments.editNotesDialog.validationError'));
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
    title={t('appointments.editNotesDialog.title')}
    description={t('appointments.editNotesDialog.description')}
  >
    {/* Appointment context info */}
    <div className="space-y-1 -mt-2 mb-2">
      <BodyText><span className="font-bold">{t('appointments.deleteDialog.petLabel')}</span> {appointment.pet.name}</BodyText>
      <BodyText><span className="font-bold">{t('appointments.deleteDialog.vetLabel')}</span> {appointment.veterinarian.clinicName || appointment.veterinarian.vetName}</BodyText>
      <BodyText><span className="font-bold">{t('appointments.deleteDialog.dateLabel')}</span> {t('appointments.editNotesDialog.dateTimeValue', { date: displayDate, time: displayTime })}</BodyText>
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
          <Label className="text-muted-foreground">{t('appointments.editNotesDialog.discussionPointsReadOnlyLabel')}</Label>
          <div className="text-sm border rounded-md p-3 bg-muted/50 text-muted-foreground">
            {appointment.reasonForVisit}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="visitNotes">{t('appointments.form.visitSummaryLabel')}</Label>
        <Textarea
          id="visitNotes"
          placeholder={t('appointments.form.visitSummaryPlaceholder')}
          rows={6}
          value={visitNotes}
          onChange={(e) => setVisitNotes(e.target.value)}
          disabled={isLoading}
          className="resize-none [word-break:break-word]"
          maxLength={200}
        />
        <HelperText>{t('appointments.form.visitSummaryCharCount', { count: visitNotes.length })}</HelperText>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.actions.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? t('appointments.editNotesDialog.submitSaving') : t('appointments.editNotesDialog.submitSave')}
        </Button>
      </div>
    </form>
  </ResponsiveDialog>
  );
}