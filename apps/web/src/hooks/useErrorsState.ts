import { useState } from 'react';
import { AppError } from '@/lib/errors';

interface UseErrorStateReturn {
  isLoading: boolean;
  error: AppError | null;
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  clearError: () => void;
  executeAction: <T>(
    action: () => Promise<T>,
    errorHandler: (error: any) => AppError
  ) => Promise<T | null>;
}

export function useErrorState(): UseErrorStateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const setLoading = (loading: boolean) => setIsLoading(loading);
  
  const clearError = () => setError(null);

  const executeAction = async <T>(
    action: () => Promise<T>,
    errorHandler: (error: any) => AppError
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      clearError();
      
      const result = await action();
      return result;
    } catch (err) {
      const appError = errorHandler(err);
      setError(appError);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    setLoading,
    setError,
    clearError,
    executeAction,
  };
}