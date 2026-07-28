import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useCookieConsentContext } from '@/contexts/CookieConsentContext';
import { useElementHeight } from '@/hooks/useElementHeight';

// Read by RootComponent's layout (see __root.tsx) to reserve exactly this
// much bottom space while the card is visible, so it's never hidden behind
// it, regardless of position/shape. Kept as a bridge via a CSS custom
// property rather than lifting state, so this component and the root layout
// don't need to share a provider tree just for a height number.
const RESERVED_HEIGHT_CSS_VAR = '--cookie-consent-reserved-height';

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const { consent, hasConsented, acceptAll, rejectNonEssential, updateConsent } =
    useCookieConsentContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingAnalytics, setPendingAnalytics] = useState(consent.analytics);
  const [cardRef, cardHeight] = useElementHeight<HTMLDivElement>();

  useEffect(() => {
    const root = document.documentElement;
    // +16px margin-equivalent gap so the reserved space isn't flush against
    // the card's own bottom offset (the card itself sits `bottom-4`/16px up).
    root.style.setProperty(
      RESERVED_HEIGHT_CSS_VAR,
      hasConsented ? '0px' : `${cardHeight + 16}px`
    );
    return () => {
      root.style.setProperty(RESERVED_HEIGHT_CSS_VAR, '0px');
    };
  }, [hasConsented, cardHeight]);

  if (hasConsented) return null;

  const openDialog = () => {
    setPendingAnalytics(consent.analytics);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    updateConsent(pendingAnalytics);
    setIsDialogOpen(false);
  };

  return (
    <>
      <div
        ref={cardRef}
        className="fixed bottom-4 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-lg border bg-background p-4 shadow-lg"
      >
        <div className="flex items-start gap-2 text-sm text-foreground mb-3">
          <Cookie className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{t('cookies.banner.description')}</span>
        </div>

        <div className="flex flex-col gap-2">
          <Button size="sm" onClick={acceptAll}>
            {t('cookies.banner.acceptAll')}
          </Button>
          <Button variant="outline" size="sm" onClick={rejectNonEssential}>
            {t('cookies.banner.rejectNonEssential')}
          </Button>
          <Button variant="ghost" size="sm" onClick={openDialog}>
            {t('cookies.banner.managePreferences')}
          </Button>
        </div>
      </div>

      <ResponsiveDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={t('cookies.dialog.title')}
        description={t('cookies.dialog.description')}
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-start gap-3">
            <Checkbox checked disabled className="mt-0.5" />
            <div>
              <p className="text-sm font-medium">{t('cookies.dialog.necessary.label')}</p>
              <p className="text-sm text-muted-foreground">
                {t('cookies.dialog.necessary.description')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              checked={pendingAnalytics}
              onCheckedChange={(checked) => setPendingAnalytics(checked === true)}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">{t('cookies.dialog.analytics.label')}</p>
              <p className="text-sm text-muted-foreground">
                {t('cookies.dialog.analytics.description')}
              </p>
            </div>
          </div>

          <Button onClick={handleSave} className="self-end">
            {t('cookies.dialog.save')}
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  );
}