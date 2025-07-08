'use client';

import { useUserSession } from '@/hooks/useUserSession';
import PetList from '@/components/pets/PetList';
import { PetListSkeleton } from '@/components/ui/skeletons/PetSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function PetsPage() {
  const { user, isLoading: isLoadingUser, error: sessionError } = useUserSession({
    redirectOnError: true,
    redirectTo: '/login'
  });

  // Loading state
  if (isLoadingUser) {
    return <PetListSkeleton />;
  }

  // Error state
  if (sessionError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load your session. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // User will always exist here due to redirect logic in hook
  if (!user) return null;

  return <PetList />;
}