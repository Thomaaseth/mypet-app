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
  import { formatDateForDisplay, formatTimeForDisplay } from '@/lib/validations/appointments';
  
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
    if (!appointment) return null;
  
    const displayDate = formatDateForDisplay(appointment.appointmentDate);
    const displayTime = formatTimeForDisplay(appointment.appointmentTime);
  
    return (
      <AlertDialog open={!!appointment} onOpenChange={(open) => !open && onCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isUpcoming ? 'Cancel Appointment?' : 'Delete Appointment?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {isUpcoming ? (
                  <p>
                    Are you sure you want to cancel this appointment? This will permanently
                    delete it from your records.
                  </p>
                ) : (
                  <p>
                    Are you sure you want to delete this appointment record? This action cannot
                    be undone.
                  </p>
                )}
  
                {/* Appointment Details */}
                <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium">Pet:</span> {appointment.pet.name}
                    </p>
                    <p>
                      <span className="font-medium">Vet:</span>{' '}
                      {appointment.veterinarian.clinicName || appointment.veterinarian.vetName}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span> {displayDate}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span> {displayTime}
                    </p>
                  </div>
                </div>
  
                {isUpcoming && (
                  <p className="text-destructive text-xs">
                    Note: If you need to reschedule, consider editing the appointment instead.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUpcoming ? 'Cancel Appointment' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }