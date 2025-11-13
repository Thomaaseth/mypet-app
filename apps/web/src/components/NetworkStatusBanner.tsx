import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export function NetworkStatusBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium z-50 flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>No internet connection. Reconnect to save changes.</span>
    </div>
  );
}