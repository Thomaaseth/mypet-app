import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FoodEntriesSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 @min-[320px]:grid-cols-3 gap-4 text-sm mb-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-8" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Used by PetListSkeleton to approximate the full FoodTracker card
export function FoodTrackerSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-28" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary grid — 2 boxes matching the "Dry/Wet Food Supply" layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg border bg-muted space-y-2 text-center">
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-7 w-16 mx-auto" />
            <Skeleton className="h-3 w-28 mx-auto" />
          </div>
          <div className="p-4 rounded-lg border bg-muted space-y-2 text-center">
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-7 w-16 mx-auto" />
            <Skeleton className="h-3 w-28 mx-auto" />
          </div>
        </div>
        {/* 2-tab row */}
        <div className="grid grid-cols-2 gap-1">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Tab content */}
        <FoodEntriesSkeleton count={1} />
      </CardContent>
    </Card>
  );
}
