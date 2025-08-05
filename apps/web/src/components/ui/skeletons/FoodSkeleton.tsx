'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FoodTrackerSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Skeleton className="h-5 w-5" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          
        {/* Food List Skeleton */}
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-muted/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
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
          ))}
        </div>
        </div>
      </CardContent>
    </Card>
  );
}