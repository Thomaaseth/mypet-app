export * from '@/shared/validations/weight';

// Date formatting utilities for weight tracking
export const formatDateForDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  export const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };
  
  export const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0];
  };