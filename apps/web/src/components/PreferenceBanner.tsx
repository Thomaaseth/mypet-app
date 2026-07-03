import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { useUpsertUserPreferences } from '@/queries/user-preferences';
import type { Locale } from '@/shared/validations/locale';
import { LOCALE_OPTIONS } from '@/lib/constants/locale-options';
import { detectBrowserTimezone } from '@/lib/utils/timezone';


function PreferenceBannerSkeleton() {
  return (
    <div className="sticky top-16 z-40 border-b bg-muted/50 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}

export function PreferenceBanner() {
  const { hasPreferences, isLoading } = usePreferencesContext();
  const { mutate: upsertPreferences, isPending } = useUpsertUserPreferences();

  if (isLoading) return <PreferenceBannerSkeleton />;
  if (hasPreferences) return null;

  const handleSelect = (locale: Locale) => {
    upsertPreferences({ locale, timezone: detectBrowserTimezone() });
  };

  return (
    <div className="sticky top-16 z-40 border-b bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 px-4 py-3">
      <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
          <Settings className="h-4 w-4 shrink-0" />
          <span className="font-medium">Choose your preferred units and date format to get started.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {LOCALE_OPTIONS.map(({ locale, label, description }) => (
            <Button
              key={locale}
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleSelect(locale)}
              className="flex flex-col h-auto py-1.5 px-3 bg-white dark:bg-amber-950 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
            >
              <span className="font-semibold text-xs">{label}</span>
              <span className="text-[10px] text-muted-foreground font-normal">{description}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}