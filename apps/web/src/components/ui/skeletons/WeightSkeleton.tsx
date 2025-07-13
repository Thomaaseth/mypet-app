import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WeightFormSkeleton() {
  return (
    <div className="space-y-4">
      {/* Weight Input */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Input */}
        <Skeleton className="h-3 w-32" /> {/* Help text */}
      </div>

      {/* Date Input */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Date input */}
        <Skeleton className="h-3 w-40" /> {/* Help text */}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-20" /> {/* Cancel */}
        <Skeleton className="h-10 w-24" /> {/* Submit */}
      </div>
    </div>
  );
}

export function WeightChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" /> {/* Icon */}
            <Skeleton className="h-6 w-32" /> {/* Title */}
          </div>
          <Skeleton className="h-5 w-16" /> {/* Trend indicator */}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Latest Weight Display */}
        <div className="text-center p-4 bg-muted/50 rounded-lg space-y-2">
          <Skeleton className="h-4 w-24 mx-auto" /> {/* Label */}
          <Skeleton className="h-8 w-20 mx-auto" /> {/* Weight value */}
          <Skeleton className="h-3 w-16 mx-auto" /> {/* Date */}
        </div>

        {/* Chart Area */}
        <div className="flex justify-center">
          <Skeleton className="w-[400px] h-[200px] rounded" />
        </div>

        {/* Chart Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <Skeleton className="h-4 w-12 mx-auto" /> {/* Label */}
            <Skeleton className="h-5 w-8 mx-auto" /> {/* Value */}
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-4 w-8 mx-auto" /> {/* Label */}
            <Skeleton className="h-5 w-12 mx-auto" /> {/* Value */}
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-4 w-8 mx-auto" /> {/* Label */}
            <Skeleton className="h-5 w-12 mx-auto" /> {/* Value */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WeightListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" /> {/* Icon */}
            <Skeleton className="h-6 w-28" /> {/* Title */}
          </div>
          <Skeleton className="h-5 w-16" /> {/* Entry count */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Table Header */}
          <div className="flex justify-between border-b pb-2">
            <Skeleton className="h-4 w-12" /> {/* Date header */}
            <Skeleton className="h-4 w-16" /> {/* Weight header */}
            <Skeleton className="h-4 w-16" /> {/* Actions header */}
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center py-2">
              <Skeleton className="h-4 w-20" /> {/* Date */}
              <Skeleton className="h-4 w-16" /> {/* Weight */}
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" /> {/* Edit button */}
                <Skeleton className="h-8 w-8" /> {/* Delete button */}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function WeightTrackerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" /> {/* Icon */}
              <Skeleton className="h-6 w-32" /> {/* Title */}
            </div>
            <Skeleton className="h-10 w-36" /> {/* Add button */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 mx-auto" /> {/* Label */}
              <Skeleton className="h-6 w-16 mx-auto" /> {/* Value */}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mx-auto" /> {/* Label */}
              <Skeleton className="h-6 w-8 mx-auto" /> {/* Value */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Skeleton */}
      <WeightChartSkeleton />

      {/* List Skeleton */}
      <WeightListSkeleton />
    </div>
  );
}