import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AppointmentCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <Skeleton className="h-5 w-28" /> {/* Pet name */}
            <Skeleton className="h-5 w-20" /> {/* Type badge */}
          </div>
          {/* Chevron expand + dropdown — matches real AppointmentCard */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Always-visible: date, time, vet — collapsed by default */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="pt-4 border-t mt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AppointmentTrackerSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <AppointmentCardSkeleton key={i} />
      ))}
    </div>
  );
}