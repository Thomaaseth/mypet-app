import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MetricLabel, MetricValue, MutedText } from '@/components/ui/typography';
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle } from 'lucide-react';
import { ANTI_PARASITE_CATEGORY_KEYS } from '@/i18n/enum-keys';
import { CATEGORY_BADGE_CLASS } from './categoryBadge';
import type { AntiParasiteCategoryCard, AntiParasiteStatus } from './antiParasiteStatus';

interface CategoryCardProps {
  card: AntiParasiteCategoryCard;
}

const STATUS_LABEL_KEY = {
  active: 'antiParasite.subCard.statusActive',
  expiring_soon: 'antiParasite.subCard.statusExpiringSoon',
  expired: 'antiParasite.subCard.statusExpired',
} as const satisfies Record<AntiParasiteStatus, string>;

export function CategoryCard({ card }: CategoryCardProps) {
  const { t } = useTranslation();
  const { formatDate } = useDateTimeFormatters();

  const { status, daysUntilExpiry, governingTreatment, categories } = card;
  const isExpired = status === 'expired';

  const countdown = isExpired
    ? t('antiParasite.subCard.overdue', { count: Math.abs(daysUntilExpiry) })
    : daysUntilExpiry === 0
      ? t('antiParasite.subCard.expiresToday')
      : t('antiParasite.subCard.daysLeft', { count: daysUntilExpiry });

  return (
    <div className={cn('flex gap-3 p-4 bg-muted/75 rounded-lg', isExpired && 'opacity-60')}>
      {/* Left: status panel */}
      <div className="flex-1 flex flex-col justify-center text-center">
      <MetricLabel>
        {categories.length === 1
          ? t(ANTI_PARASITE_CATEGORY_KEYS[categories[0]])
          : t('antiParasite.subCard.treatmentStatus')}
      </MetricLabel>
        <MetricValue>{t(STATUS_LABEL_KEY[status])}</MetricValue>
        <MutedText className={cn(status === 'expiring_soon' && 'text-accent font-medium')}>
          {countdown}
        </MutedText>
      </div>

      {/* Right: nested detail card (active/expiring only; expired reserves this
          space for the future add-treatment CTA) */}
      {!isExpired && (
        <div className="flex-1 bg-background rounded-lg p-3 flex flex-col gap-2">
          <div className="font-display font-semibold">{governingTreatment.productName}</div>
          <div className="flex flex-wrap gap-1">
            {governingTreatment.categories.map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className={cn('text-xs', CATEGORY_BADGE_CLASS[cat])}
              >
                {t(ANTI_PARASITE_CATEGORY_KEYS[cat])}
              </Badge>
            ))}
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {t('antiParasite.subCard.administeredOn', {
                date: formatDate(governingTreatment.dateAdministered),
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3" />
              {t('antiParasite.subCard.protectedUntil', {
                date: formatDate(governingTreatment.expiryDate),
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}