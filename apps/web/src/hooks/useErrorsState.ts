import { useState } from 'react';
import { AppError } from '@/lib/errors';
import { toastService } from '@/lib/toast';

interface UseErrorStateOptions {
  showErrorToast?: boolean;
  toastCriticalOnly?: boolean;
}

interface UseErrorStateReturn {
  isLoading: boolean;
  error: AppError | null;
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  clearError: () => void;
  executeAction: <T>(
    action: () => Promise<T>,
    errorHandler: (error: unknown) => AppError
  ) => Promise<T | null>;
}

export function useErrorState(options: UseErrorStateOptions = {}): UseErrorStateReturn {
  const { showErrorToast = false, toastCriticalOnly = false } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const setLoading = (loading: boolean) => setIsLoading(loading);
  
  const clearError = () => setError(null);

  const shouldShowToast = (appError: AppError): boolean => {
    if (!showErrorToast) return false;
    
    if (toastCriticalOnly) {
      // Only show toasts for critical errors
      const criticalCodes = ['NETWORK_ERROR', 'SERVER_ERROR', 'RATE_LIMITED'];
      return criticalCodes.includes(appError.code || '');
    }
    
    return true;
  };

  // Smart error display logic
  const handleError = (appError: AppError | null) => {
    setError(appError);
    
    // Only process toasts for actual errors (not null)
    if (appError && shouldShowToast(appError)) {
      // Field-specific error messages for toasts
      if (appError.field === 'email' && appError.code === 'EMAIL_EXISTS') {
        toastService.error(
          "Email already in use", 
          "Try signing in instead or use a different email"
        );
      } else if (appError.code === 'INVALID_CREDENTIALS') {
        toastService.error(
          "Invalid credentials", 
          "Please check your email and password"
        );
      } else if (appError.code === 'WEAK_PASSWORD') {
        // Don't show toast for weak password - better handled inline
        return;
      } else {
        // Generic error toast
        toastService.error("Something went wrong", appError.message);
      }
    }
  };

  const executeAction = async <T>(
    action: () => Promise<T>,
    errorHandler: (error: unknown) => AppError
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      clearError();
      
      const result = await action();
      return result;
    } catch (err: unknown) {
      const appError = errorHandler(err);
      handleError(appError)
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    setLoading,
    setError: handleError,
    clearError,
    executeAction,
  };
}