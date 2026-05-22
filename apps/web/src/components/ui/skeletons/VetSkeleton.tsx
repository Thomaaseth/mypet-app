import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function VetCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <Skeleton className="h-6 w-36" /> {/* Clinic/vet name */}
            <Skeleton className="h-4 w-24" /> {/* Vet name (when clinic exists) */}
            <Skeleton className="h-5 w-20" /> {/* Assigned pets badge */}
          </div>
          <Skeleton className="h-8 w-8" /> {/* Menu button */}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contact info */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" /> {/* Phone icon */}
          <Skeleton className="h-4 w-32" /> {/* Phone number */}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" /> {/* Email icon */}
          <Skeleton className="h-4 w-40" /> {/* Email */}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" /> {/* Globe icon */}
          <Skeleton className="h-4 w-28" /> {/* Website */}
        </div>
        <div className="flex items-start gap-2">
          <Skeleton className="h-4 w-4 mt-0.5" /> {/* MapPin icon */}
          <Skeleton className="h-4 w-48" /> {/* Address */}
        </div>

        {/* Notes — fixed h-[80px] to match card */}
        <div className="pt-3 border-t h-[80px] space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>

        {/* Assigned Pets — fixed h-[120px] to match card */}
        <div className="pt-3 border-t h-[120px] space-y-2">
          <Skeleton className="h-4 w-28" /> {/* "Assigned Pets:" label */}
          <div className="flex gap-1 flex-wrap">
            <Skeleton className="h-5 w-16" /> {/* Pet badge */}
            <Skeleton className="h-5 w-14" /> {/* Pet badge */}
          </div>
        </div>

        {/* Action button */}
        <div className="flex gap-2 pt-3 border-t">
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

// header (title + description + add button) + grid of vet cards
export function VetListSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-9 w-48" /> {/* "My Veterinarians" title */}
            <Skeleton className="h-5 w-64" /> {/* Description */}
          </div>
          <Skeleton className="h-10 w-36" /> {/* Add Veterinarian button */}
        </div>

        {/* Vet cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <VetCardSkeleton />
          <VetCardSkeleton />
          <VetCardSkeleton />
        </div>
      </div>
    </div>
  );
}