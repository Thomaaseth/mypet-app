import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PetCardSkeleton } from './PetSkeleton';
import { WeightTrackerSkeleton } from './WeightSkeleton';
import { FoodTrackerSkeleton } from './FoodSkeleton';
import { NotesWidgetSkeleton } from './NotesSkeleton';

export function PetListSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Tabs */}
        <div className="flex w-full overflow-hidden gap-1">
          <Skeleton className="h-10 min-w-[160px]" />
          <Skeleton className="h-10 min-w-[160px]" />
          <Skeleton className="h-10 min-w-[160px]" />
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

          {/* Left col — PetCard */}
          <div className="lg:sticky lg:top-4">
            <PetCardSkeleton />
          </div>

          {/* Right col */}
          <div className="min-w-0 space-y-6">
            <div className="grid grid-cols-1 3xl:grid-cols-2 gap-6">
              <WeightTrackerSkeleton />
              <FoodTrackerSkeleton />
            </div>
            <NotesWidgetSkeleton />
            {/* Coming Soon card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}