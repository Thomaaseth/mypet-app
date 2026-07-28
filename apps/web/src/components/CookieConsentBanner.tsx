import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useCookieConsentContext } from '@/contexts/CookieConsentContext';

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const { consent, hasConsented, acceptAll, rejectNonEssential, updateConsent } =
    useCookieConsentContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingAnalytics, setPendingAnalytics] = useState(consent.analytics);

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
      <div className="sticky bottom-0 left-0 right-0 z-50 border-t bg-background px-4 py-4 shadow-lg">
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-2 text-sm text-foreground">
            <Cookie className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
            <span>{t('cookies.banner.description')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={openDialog}>
              {t('cookies.banner.managePreferences')}
            </Button>
            <Button variant="outline" size="sm" onClick={rejectNonEssential}>
              {t('cookies.banner.rejectNonEssential')}
            </Button>
            <Button size="sm" onClick={acceptAll}>
              {t('cookies.banner.acceptAll')}
            </Button>
          </div>
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