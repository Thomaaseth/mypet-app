'use client';

import { authClient } from '../../../lib/auth-client';
import { useErrorState } from '../../../hooks/useErrorsState';
import { authErrorHandler } from '../../../lib/errors/handlers';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export default function LogoutButton({ 
  variant = 'ghost', 
  size = 'default',
  className = '',
  children,
  showIcon = true
}: LogoutButtonProps) {
  const router = useRouter();
  const { isLoading, executeAction } = useErrorState();

  const handleLogout = async () => {
    const result = await executeAction(
      async () => {
        const { error } = await authClient.signOut({

        });

        if (error) {
          throw error;
        }

        return { success: true };
      },
      authErrorHandler
    );

    if (result) {
      router.push('/');
      router.refresh(); // Refresh to update any server-side state
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        showIcon && <LogOut className="mr-2 h-4 w-4" />
      )}
      {children || (isLoading ? 'Signing out...' : 'Sign out')}
    </Button>
  );
}
