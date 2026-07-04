import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { useUpsertUserPreferences } from '@/queries/user-preferences';
import type { DateTimeLocale } from '@/shared/validations/locale';
import type { UnitSystem } from '@/shared/validations/units';
import { DATE_TIME_LOCALE_OPTIONS, UNIT_SYSTEM_OPTIONS } from '@/lib/constants/locale-options';
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

  const [pendingDateTimeLocale, setPendingDateTimeLocale] = useState<DateTimeLocale | null>(null);
  const [pendingUnitSystem, setPendingUnitSystem] = useState<UnitSystem | null>(null);

  if (isLoading) return <PreferenceBannerSkeleton />;
  if (hasPreferences) return null;

  const canSave = pendingDateTimeLocale !== null && pendingUnitSystem !== null;

  const handleSave = () => {
    if (!canSave) return;
    upsertPreferences({
      dateTimeLocale: pendingDateTimeLocale,
      unitSystem: pendingUnitSystem,
      timezone: detectBrowserTimezone(),
    });
  };

  return (
    <div className="sticky top-16 z-40 border-b bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 px-4 py-3">
      <div className="container mx-auto flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
          <Settings className="h-4 w-4 shrink-0" />
          <span className="font-medium">Choose your preferred date/time format and units to get started.</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Date/time format group */}
          <div className="flex items-center gap-2">
            {DATE_TIME_LOCALE_OPTIONS.map(({ dateTimeLocale, label, description }) => (
              <Button
                key={dateTimeLocale}
                variant={pendingDateTimeLocale === dateTimeLocale ? 'default' : 'outline'}
                size="sm"
                disabled={isPending}
                onClick={() => setPendingDateTimeLocale(dateTimeLocale)}
                className="flex flex-col h-auto py-1.5 px-3 bg-white dark:bg-amber-950 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                <span className="font-semibold text-xs">{label}</span>
                <span className="text-[10px] text-muted-foreground font-normal">{description}</span>
              </Button>
            ))}
          </div>

          {/* Unit system group */}
          <div className="flex items-center gap-2">
            {UNIT_SYSTEM_OPTIONS.map(({ unitSystem, label, description }) => (
              <Button
                key={unitSystem}
                variant={pendingUnitSystem === unitSystem ? 'default' : 'outline'}
                size="sm"
                disabled={isPending}
                onClick={() => setPendingUnitSystem(unitSystem)}
                className="flex flex-col h-auto py-1.5 px-3 bg-white dark:bg-amber-950 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                <span className="font-semibold text-xs">{label}</span>
                <span className="text-[10px] text-muted-foreground font-normal">{description}</span>
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            disabled={!canSave || isPending}
            onClick={handleSave}
            className="shrink-0"
          >
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}