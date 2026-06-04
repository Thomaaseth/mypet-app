import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function VetCardSkeleton() {
  return (
    <div className="flex items-start gap-3 py-4 px-6">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-3 w-32 ml-6" />
        <Skeleton className="h-3 w-24 ml-6" />
        <div className="flex gap-1 ml-6 pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

export function VetListSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <VetCardSkeleton />
            <VetCardSkeleton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}