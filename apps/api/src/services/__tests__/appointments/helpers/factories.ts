import type { AppointmentFormData } from "@/shared/validations/appointments";

export function makeAppointmentData(
  overrides: Partial<AppointmentFormData> = {}
): AppointmentFormData {
  return {
    petId: '', // always overridden with a real testPet.id at the call site
    veterinarianId: '', // always overridden with a real testVet.id at the call site
    appointmentDate: '2024-06-15',
    appointmentTime: '14:00',
    appointmentType: 'checkup',
    reasonForVisit: 'Annual check',
    visitNotes: '',
    ...overrides,
  };
}