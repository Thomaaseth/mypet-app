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
import { Loader2 } from 'lucide-react';
import type { AppointmentWithRelations } from '@/types/appointments';
import { LONG_DATE_DISPLAY_OPTIONS } from '@/lib/utils/date-formatting';
import { useTranslation } from 'react-i18next';
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';

interface DeleteAppointmentDialogProps {
  appointment: AppointmentWithRelations | null;
  isUpcoming: boolean;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteAppointmentDialog({
  appointment,
  isUpcoming,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteAppointmentDialogProps) {
  const { t } = useTranslation();
  const { formatDate, formatTime } = useDateTimeFormatters();

  if (!appointment) return null;  

  const displayDate = formatDate(appointment.appointmentDate, LONG_DATE_DISPLAY_OPTIONS)
  const displayTime = formatTime(appointment.appointmentTime)

  return (
    <AlertDialog open={!!appointment} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isUpcoming ? t('appointments.deleteDialog.cancelTitle') : t('appointments.deleteDialog.deleteTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {isUpcoming ? (
                <p>
                  {t('appointments.deleteDialog.cancelDescription')}
                </p>
              ) : (
                <p>
                  {t('appointments.deleteDialog.deleteDescription')}
                </p>
              )}

              {/* Appointment Details */}
              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">{t('appointments.deleteDialog.petLabel')}</span> {appointment.pet.name}
                  </p>
                  <p>
                    <span className="font-medium">{t('appointments.deleteDialog.vetLabel')}</span>{' '}
                    {appointment.veterinarian.clinicName || appointment.veterinarian.vetName}
                  </p>
                  <p>
                    <span className="font-medium">{t('appointments.deleteDialog.dateLabel')}</span> {displayDate}
                  </p>
                  <p>
                    <span className="font-medium">{t('appointments.deleteDialog.timeLabel')}</span> {displayTime}
                  </p>
                </div>
              </div>

              {isUpcoming && (
                <p className="text-destructive text-xs">
                  {t('appointments.deleteDialog.rescheduleNote')}
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('common.actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpcoming ? t('appointments.deleteDialog.confirmCancel') : t('common.actions.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}