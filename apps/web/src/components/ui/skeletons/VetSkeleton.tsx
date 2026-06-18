import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentCardSkeleton } from './AppointmentSkeleton';

export function VetCardSkeleton() {
  return (
    <div className="flex items-start gap-3 py-4 px-6">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-3 w-32 ml-6" />
        <Skeleton className="h-3 w-24 ml-6" />
        <div className="flex gap-1 ml-6 pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
      {/* Chevron expand + dropdown — matches real VetCard */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

export function VetListSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>

        {/* Vets card */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-8 w-8 sm:h-9 sm:w-24" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <VetCardSkeleton />
              <VetCardSkeleton />
            </div>
          </CardContent>
        </Card>

        {/* AppointmentTracker card — collapsed tabs, matching default state */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-8 w-8 sm:h-9 sm:w-36" />
            </div>
          </CardHeader>
          <CardContent>
            {/* 2-tab row */}
            <div className="grid grid-cols-2 gap-1 mb-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            {/* Appointment cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AppointmentCardSkeleton />
              <AppointmentCardSkeleton />
              <AppointmentCardSkeleton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}