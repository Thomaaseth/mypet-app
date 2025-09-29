'use client';

import { useSessionContext } from '@/contexts/SessionContext';
import { useUserSession } from '@/hooks/useUserSession';
import PetList from '@/components/pets/PetList';
import { PetListSkeleton } from '@/components/ui/skeletons/PetSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function PetsPage() {
  const { user, isLoading: isLoadingUser, error: sessionError } = useSessionContext();


  // Loading state
  if (isLoadingUser) {
    return <PetListSkeleton />;
  }

  // Error state (not needed - middleware protects the route)
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

  // Middleware ensures user exists, but safety check
  if (!user) return null;

  return <PetList />;
}