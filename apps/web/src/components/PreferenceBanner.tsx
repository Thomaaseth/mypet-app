import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { useUpsertUserPreferences } from '@/queries/user-preferences';
import type { DateFormat } from '@/shared/validations/date-format';
import type { TimeFormat } from '@/shared/validations/time-format';
import type { UnitSystem } from '@/shared/validations/units';
import { DATE_FORMAT_OPTIONS, TIME_FORMAT_OPTIONS, UNIT_SYSTEM_OPTIONS } from '@/lib/constants/locale-options';
import { detectBrowserTimezone } from '@/lib/utils/timezone';
import { PreferenceOptionButton } from '@/components/ui/preference-option-button';
import { useTranslation } from 'react-i18next';
import {
  DATE_FORMAT_LABEL_KEYS,
  DATE_FORMAT_DESCRIPTION_KEYS,
  TIME_FORMAT_LABEL_KEYS,
  TIME_FORMAT_DESCRIPTION_KEYS,
  UNIT_SYSTEM_LABEL_KEYS,
  UNIT_SYSTEM_DESCRIPTION_KEYS,
} from '@/i18n/enum-keys';

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
  const { t } = useTranslation();
  const { hasPreferences, isLoading } = usePreferencesContext();
  const { mutate: upsertPreferences, isPending } = useUpsertUserPreferences();

  const [pendingDateFormat, setPendingDateFormat] = useState<DateFormat | null>(null);
  const [pendingTimeFormat, setPendingTimeFormat] = useState<TimeFormat | null>(null);
  const [pendingUnitSystem, setPendingUnitSystem] = useState<UnitSystem | null>(null);
  
  if (isLoading) return <PreferenceBannerSkeleton />;
  if (hasPreferences) return null;

  const canSave = pendingDateFormat !== null && pendingTimeFormat !== null && pendingUnitSystem !== null;

  const handleSave = () => {
    if (!canSave) return;
    upsertPreferences({
      dateFormat: pendingDateFormat,
      timeFormat: pendingTimeFormat,
      unitSystem: pendingUnitSystem,
      timezone: detectBrowserTimezone(),
    });
  };

  return (
    <div className="sticky top-16 z-40 border-b bg-muted px-4 py-3">
      <div className="container mx-auto flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Settings className="h-4 w-4 shrink-0" />
          <span className="font-medium">{t('preferences.banner.description')}</span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Date format group */}
            <div className="flex gap-2 flex-1">
              {DATE_FORMAT_OPTIONS.map(({ dateFormat }) => (
                <PreferenceOptionButton
                  key={dateFormat}
                  label={t(DATE_FORMAT_LABEL_KEYS[dateFormat])}
                  description={t(DATE_FORMAT_DESCRIPTION_KEYS[dateFormat])}
                  isActive={pendingDateFormat === dateFormat}
                  disabled={isPending}
                  size="compact"
                  onClick={() => setPendingDateFormat(dateFormat)}
                />
              ))}
            </div>

            {/* Time format group */}
            <div className="flex gap-2 flex-1">
              {TIME_FORMAT_OPTIONS.map(({ timeFormat }) => (
                <PreferenceOptionButton
                  key={timeFormat}
                  label={t(TIME_FORMAT_LABEL_KEYS[timeFormat])}
                  description={t(TIME_FORMAT_DESCRIPTION_KEYS[timeFormat])}
                  isActive={pendingTimeFormat === timeFormat}
                  disabled={isPending}
                  size="compact"
                  onClick={() => setPendingTimeFormat(timeFormat)}
                />
              ))}
            </div>

            {/* Unit system group */}
            <div className="flex gap-2 flex-1">
              {UNIT_SYSTEM_OPTIONS.map(({ unitSystem }) => (
                <PreferenceOptionButton
                key={unitSystem}
                label={t(UNIT_SYSTEM_LABEL_KEYS[unitSystem])}
                description={t(UNIT_SYSTEM_DESCRIPTION_KEYS[unitSystem])}
                isActive={pendingUnitSystem === unitSystem}
                disabled={isPending}
                size="compact"
                onClick={() => setPendingUnitSystem(unitSystem)}
              />
              ))}
            </div>
           </div>

            <Button
              size="sm"
              disabled={!canSave || isPending}
              onClick={handleSave}
              className="shrink-0"
            >
              {isPending ? t('preferences.banner.saving') : t('common.actions.save')}
            </Button>
        </div>
      </div>
    </div>
  );
}