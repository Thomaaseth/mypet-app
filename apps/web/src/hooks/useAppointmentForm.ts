import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  appointmentFormSchema, 
  getTodayDateString,
  type AppointmentFormData 
} from '@/lib/validations/appointments';
import type { AppointmentWithRelations } from '@/types/appointments';

interface UseAppointmentFormOptions {
  defaultValues?: Partial<AppointmentFormData>;
  appointment?: AppointmentWithRelations; // For editing existing appointments
}

export function useAppointmentForm(options: UseAppointmentFormOptions = {}) {
  const { defaultValues, appointment } = options;

  // Convert Appointment data to form data if editing
  const getInitialValues = (): AppointmentFormData => {
    if (appointment) {
      return {
        petId: appointment.petId,
        veterinarianId: appointment.veterinarianId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime.slice(0, 5), // HH:MM:SS -> HH:MM
        appointmentType: appointment.appointmentType,
        reasonForVisit: appointment.reasonForVisit || '',
        visitNotes: appointment.visitNotes || '',
      };
    }

    return {
      petId: '',
      veterinarianId: '',
      appointmentDate: getTodayDateString(),
      appointmentTime: '09:00',
      appointmentType: 'checkup',
      reasonForVisit: '',
      visitNotes: '',
      ...defaultValues,
    };
  };

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: getInitialValues(),
  });

  // Reset form with new appointment data (useful for switching between appointments)
  const resetWithAppointment = (newAppointment: AppointmentWithRelations) => {
    const formData: AppointmentFormData = {
      petId: newAppointment.petId,
      veterinarianId: newAppointment.veterinarianId,
      appointmentDate: newAppointment.appointmentDate,
      appointmentTime: newAppointment.appointmentTime.slice(0, 5), // HH:MM:SS -> HH:MM
      appointmentType: newAppointment.appointmentType,
      reasonForVisit: newAppointment.reasonForVisit || '',
      visitNotes: newAppointment.visitNotes || '',
    };
    
    form.reset(formData);
  };

  // Reset to empty form
  const resetToEmpty = () => {
    form.reset({
      petId: '',
      veterinarianId: '',
      appointmentDate: getTodayDateString(),
      appointmentTime: '09:00',
      appointmentType: 'checkup',
      reasonForVisit: '',
      visitNotes: '',
      ...defaultValues,
    });
  };

  return {
    ...form,
    resetWithAppointment,
    resetToEmpty,
  };
}