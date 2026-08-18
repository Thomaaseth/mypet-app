import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WeightTrackerSkeleton } from './WeightSkeleton';
import { FoodTrackerSkeleton } from './FoodSkeleton';
import { NotesWidgetSkeleton } from './NotesSkeleton';
import { AntiParasiteTrackerSkeleton } from './AntiParasiteSkeleton';

export function PetCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" /> {/* Pet name */}
            <Skeleton className="h-4 w-20" /> {/* Species */}
          </div>
          <Skeleton className="h-8 w-8 flex-shrink-0" /> {/* Dropdown menu button */}
        </div>
      </CardHeader>
      <CardContent className="pt-1 px-4 pb-4">
        <div className="flex gap-3 lg:flex-col lg:gap-0">
          {/* Photo */}
          <Skeleton className="flex-shrink-0 w-[45%] aspect-square lg:w-full lg:aspect-square lg:mb-3 rounded-md" />

          {/* Info — vertical stack, matches real gender/neutered/age/weight rows */}
          <div className="flex-1 min-w-0 flex flex-col gap-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PetListSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-10 w-full" />

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          <div className="lg:sticky lg:top-4">
            <PetCardSkeleton />
          </div>
          <div className="min-w-0 space-y-6">
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
              <WeightTrackerSkeleton />
              <FoodTrackerSkeleton />
            </div>
            <AntiParasiteTrackerSkeleton />
            <NotesWidgetSkeleton />
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
