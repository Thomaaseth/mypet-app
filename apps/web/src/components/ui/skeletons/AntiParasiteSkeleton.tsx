import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';


export function AntiParasiteTrackerSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
          {/* Add button — matches the responsive "+" → "+ Add treatment" CTA */}
          <Skeleton className="h-8 w-8 sm:h-9 sm:w-36" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sub-cards — one per treated category. Mirrors CategoryCard's two-panel
            layout (centered status panel + nested detail card) and the real grid
            for a 2-card state (GRID_COLS_BY_COUNT[2]). */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4 bg-muted/75 rounded-lg">
              {/* Left: status panel */}
              <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-2 text-center">
                <Skeleton className="h-3 w-20" /> {/* MetricLabel */}
                <Skeleton className="h-6 w-24" /> {/* MetricValue (status) */}
                <Skeleton className="h-3 w-16" /> {/* countdown */}
              </div>

              {/* Right: nested detail card */}
              <div className="flex-1 min-w-0 bg-background rounded-lg p-3 flex flex-col gap-2">
                <Skeleton className="h-5 w-28" /> {/* product name */}
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-32" /> {/* administered on */}
                  <Skeleton className="h-3 w-28" /> {/* protected until */}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* History — collapsed by default, matching real initial state */}
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