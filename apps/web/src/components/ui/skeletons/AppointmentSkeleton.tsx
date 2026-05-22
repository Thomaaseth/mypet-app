import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AppointmentCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-28" /> {/* Pet name */}
              <Skeleton className="h-5 w-20" /> {/* Type badge */}
            </div>
            <Skeleton className="h-4 w-16" /> {/* Animal type */}
          </div>
          <Skeleton className="h-8 w-8" /> {/* Menu button */}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 flex-1">
        {/* Date and Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" /> {/* Calendar icon */}
            <Skeleton className="h-4 w-32" /> {/* Date */}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" /> {/* Clock icon */}
            <Skeleton className="h-4 w-20" /> {/* Time */}
          </div>
        </div>

        {/* Vet Info — fixed h-[100px] to match card */}
        <div className="pt-2 border-t space-y-2 h-[100px]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" /> {/* Building icon */}
            <Skeleton className="h-4 w-36" /> {/* Clinic name */}
          </div>
          <div className="flex items-center gap-2 ml-6">
            <Skeleton className="h-3 w-3" /> {/* Stethoscope icon */}
            <Skeleton className="h-4 w-28" /> {/* Vet name */}
          </div>
          <div className="flex items-start gap-2 ml-6">
            <Skeleton className="h-4 w-4" /> {/* MapPin icon */}
            <Skeleton className="h-3 w-40" /> {/* Address */}
          </div>
        </div>

        {/* Discussion Points — fixed h-[120px] to match card */}
        <div className="pt-2 border-t h-[120px] space-y-2">
          <Skeleton className="h-4 w-32" /> {/* Label */}
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>

        {/* Action Button */}
        <div className="flex gap-2 pt-2 mt-auto">
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

// Grid of 3 cards
export function AppointmentTrackerSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <AppointmentCardSkeleton key={i} />
      ))}
    </div>
  );
}