import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useCookieConsentContext } from '@/contexts/CookieConsentContext';

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const {
    consent,
    hasConsented,
    acceptAll,
    rejectNonEssential,
    updateConsent,
    isPreferencesDialogOpen,
    openPreferencesDialog,
    closePreferencesDialog,
  } = useCookieConsentContext();

  // Local only to this render of the dialog's checkboxes — reset from the
  // persisted consent each time the dialog opens, so a cancel doesn't leak
  // an uncommitted change into the next open.
  const [pendingAnalytics, setPendingAnalytics] = useState(consent.analytics);

  const openDialog = () => {
    setPendingAnalytics(consent.analytics);
    openPreferencesDialog();
  };

  const handleSave = () => {
    updateConsent(pendingAnalytics);
    closePreferencesDialog();
  };

  return (
    <>
      {/* Only the initial-choice card is gated on hasConsented — the dialog
          below is not, so "Manage preferences" keeps working (e.g. via the
          Footer's persistent link) even long after the banner itself is
          gone. See CookieConsentContext for why this state lives there. */}
      {!hasConsented && (
        <div
          // Floats just above the footer's own measured height (published by
          // Footer.tsx as --footer-height), rather than the page reserving
          // padding sized to the card itself.
          style={{ bottom: 'calc(var(--bottom-nav-height, 0px) + 1rem)' }}
            className="sticky z-50 ml-4 mx-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border bg-background p-4 shadow-lg"
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
      )}

      <ResponsiveDialog
        open={isPreferencesDialogOpen}
        onOpenChange={(open) => (open ? openDialog() : closePreferencesDialog())}
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