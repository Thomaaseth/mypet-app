import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WeightFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function WeightTrackerSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 sm:h-9 sm:w-28" />
            <Skeleton className="h-8 w-8 sm:h-9 sm:w-36" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weight Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg space-y-2">
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-8 w-20 mx-auto" />
              <Skeleton className="h-3 w-28 mx-auto" />
            </div>
            <div className="flex items-center gap-1 justify-center">
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-7 w-12" />
            </div>
            <Skeleton className="w-full h-[220px] sm:h-[300px] rounded" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <Skeleton className="h-3 w-12 mx-auto" />
                <Skeleton className="h-5 w-8 mx-auto" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-8 mx-auto" />
                <Skeleton className="h-5 w-12 mx-auto" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-8 mx-auto" />
                <Skeleton className="h-5 w-12 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight History — collapsed by default, matching real initial state */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </CardContent>
    </Card>
  );
}