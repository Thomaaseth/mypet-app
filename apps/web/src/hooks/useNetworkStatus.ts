import { useState, useEffect } from 'react';


export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    // Log initial state
    console.log('[Network] Initial status:', navigator.onLine);

    const handleOnline = (): void => {
      console.log('[Network] ✅ Online');
      setIsOnline(true);
    };
    
    const handleOffline = (): void => {
      console.log('[Network] ❌ Offline');
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