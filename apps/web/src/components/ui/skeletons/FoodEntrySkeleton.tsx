'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface FoodEntrySkeletonProps {
  className?: string;
}

export function FoodEntrySkeleton({ className }: FoodEntrySkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" /> {/* Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" /> {/* Icon */}
                <Skeleton className="h-4 w-16" /> {/* Weight/Units */}
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" /> {/* Icon */}
                <Skeleton className="h-4 w-20" /> {/* Daily amount */}
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" /> {/* Icon */}
                <Skeleton className="h-4 w-24" /> {/* Date */}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Skeleton className="h-6 w-16" /> {/* Status badge */}
            <Skeleton className="h-8 w-8" /> {/* Edit button */}
            <Skeleton className="h-8 w-8" /> {/* Delete button */}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" /> {/* Label */}
            <Skeleton className="h-6 w-20" /> {/* Value */}
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" /> {/* Label */}
            <Skeleton className="h-6 w-8" /> {/* Value */}
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" /> {/* Label */}
            <Skeleton className="h-6 w-24" /> {/* Value */}
          </div>
        </div>
        
        {/* Progress Bar Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-12" /> {/* Progress label */}
            <Skeleton className="h-4 w-20" /> {/* Percentage */}
          </div>
          <Skeleton className="h-2 w-full rounded-full" /> {/* Progress bar */}
        </div>
      </CardContent>
    </Card>
  );
}

// For when a new entry is being created
export function NewFoodEntrySkeleton({ className }: FoodEntrySkeletonProps) {
  return (
    <Card className={`${className} border-dashed border-2 animate-pulse`}>
      <CardContent className="pt-6">
        <div className="text-center py-4">
          <Skeleton className="h-4 w-32 mx-auto mb-2" />
          <Skeleton className="h-3 w-48 mx-auto" />
        </div>
      </CardContent>
    </Card>
  );
}