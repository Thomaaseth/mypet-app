export * from '@/shared/validations/appointments';
import type { Locale } from '@/shared/validations/locale';


  
  // Time formatting utilities
  export const formatTimeForDisplay = (timeString: string, locale: Locale): string => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  export const formatTimeForInput = (timeString: string): string => {
    // Ensure HH:MM format for input
    return timeString.slice(0, 5);
  };
  
  // Generate time options for dropdown (5-minute increments, 24h format)
  export const generateTimeOptions = (): string[] => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        options.push(`${hourStr}:${minuteStr}`);
      }
    }
    return options;
  };
  
  // Helper to check if appointment is upcoming or past
  export const isUpcomingAppointment = (appointmentDate: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const apptDate = new Date(appointmentDate);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate >= today;
  };

