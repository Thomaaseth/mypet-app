import { useState, useEffect } from 'react';
import { networkLogger } from '@/lib/logger';


export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    // Log initial state
    networkLogger.debug('Initial network status', { isOnline: navigator.onLine });

    const handleOnline = (): void => {
      networkLogger.info('Network connection restored');
      setIsOnline(true);
    };
    
    const handleOffline = (): void => {
      networkLogger.warn('Network connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Log whenever state changes
  useEffect(() => {
    console.log('[Network] Current status:', isOnline);
  }, [isOnline]);

  return isOnline;
}