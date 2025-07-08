import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PetCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" /> {/* Pet name */}
            <Skeleton className="h-4 w-24" /> {/* Species */}
          </div>
          <Skeleton className="h-8 w-8" /> {/* Menu button */}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pet Image */}
        <Skeleton className="w-full h-32 rounded-md" />
        
        {/* Badges Row */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" /> {/* Gender badge */}
            <Skeleton className="h-6 w-24" /> {/* Neutered badge */}
          </div>
        </div>
        
        {/* Age and Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" /> {/* Calendar icon */}
            <Skeleton className="h-4 w-16" /> {/* Age */}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" /> {/* Weight icon */}
            <Skeleton className="h-4 w-12" /> {/* Weight */}
          </div>
        </div>
        
        {/* Microchip */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" /> {/* MapPin icon */}
          <Skeleton className="h-4 w-20" /> {/* Microchip */}
        </div>
        
        {/* Notes */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" /> {/* View button */}
          <Skeleton className="h-9 flex-1" /> {/* Edit button */}
        </div>
      </CardContent>
    </Card>
  );
}

export function PetListSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" /> {/* Title */}
            <Skeleton className="h-5 w-48" /> {/* Description */}
          </div>
          <Skeleton className="h-10 w-24" /> {/* Add button */}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" /> {/* Tab 1 */}
            <Skeleton className="h-10 w-20" /> {/* Tab 2 */}
            <Skeleton className="h-10 w-28" /> {/* Tab 3 */}
          </div>
          
          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PetCardSkeleton />
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" /> {/* Quick Stats title */}
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-28" /> {/* Coming Soon title */}
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PetFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Pet Name */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Input */}
      </div>

      {/* Species */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Input */}
        <Skeleton className="h-3 w-48" /> {/* Help text */}
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Select */}
      </div>

      {/* Birth Date */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Date input */}
        <Skeleton className="h-3 w-56" /> {/* Help text */}
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" /> {/* Label */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" /> {/* Weight input */}
          <Skeleton className="h-10 w-24" /> {/* Unit select */}
        </div>
        <Skeleton className="h-3 w-44" /> {/* Help text */}
      </div>

      {/* Microchip */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Input */}
        <Skeleton className="h-3 w-36" /> {/* Help text */}
      </div>

      {/* Checkbox */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" /> {/* Checkbox */}
        <Skeleton className="h-4 w-24" /> {/* Label */}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" /> {/* Label */}
        <Skeleton className="h-20 w-full" /> {/* Textarea */}
        <Skeleton className="h-3 w-52" /> {/* Help text */}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-20" /> {/* Cancel */}
        <Skeleton className="h-10 w-24" /> {/* Submit */}
      </div>
    </div>
  );
}