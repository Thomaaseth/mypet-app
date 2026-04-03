import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function NotesWidgetSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" /> {/* Icon */}
            <Skeleton className="h-6 w-32" /> {/* Title */}
          </div>
          <Skeleton className="h-9 w-24" /> {/* Add button */}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" /> {/* Bullet */}
            <Skeleton className="h-4 w-full" /> {/* Note content */}
            <Skeleton className="h-7 w-7 flex-shrink-0" /> {/* Delete button */}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}