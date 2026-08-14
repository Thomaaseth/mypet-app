import { Trans, useTranslation } from 'react-i18next';
import { X, SquareArrowUp, SquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useInstallPromptContext } from '@/contexts/InstallPromptContext';

export function InstallPrompt() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { shouldShowBanner, platform, promptInstall, dismiss } = useInstallPromptContext();

  // Scoped to mobile per product decision.
  if (!isMobile || !shouldShowBanner) return null;

  const handleInstallClick = async (): Promise<void> => {
    // Chromium only: fire the browser's native install prompt. Dismiss on any
    // resolved choice so the banner doesn't linger after the user decided.
    const outcome = await promptInstall();
    if (outcome !== null) dismiss();
  };

  return (
    <div
      // Floating card: inset from all edges with a gap at the bottom (plus iOS
      // home-indicator clearance), so it hovers over the page rather than
      // docking full-width over the footer / language switcher.
      className="fixed inset-x-4 z-50 mx-auto max-w-sm rounded-lg border bg-background px-4 py-3 shadow-lg"
      style={{ bottom: 'calc(var(--footer-height, 0px))' }}
    >
      {/* Purpose line — shown on every platform so the user knows what this is. */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 text-sm text-foreground">
          <span>{t('install.banner.description')}</span>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('install.banner.dismiss')}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {platform === 'ios' ? (
        // iOS: one instruction line; action names bolded via <Trans>.
        <p className="mt-2 text-sm text-muted-foreground">
          <Trans
            i18nKey="install.banner.iosInstruction"
            components={{
              b: <strong className="font-semibold text-foreground" />,
              share: (
                <SquareArrowUp
                  className="mx-0.5 inline h-4 w-4 align-text-bottom text-foreground"
                  aria-hidden="true"
                />
              ),
              add: (
                <SquarePlus
                  className="mx-0.5 inline h-4 w-4 align-text-bottom text-foreground"
                  aria-hidden="true"
                />
              ),
            }}
          />
        </p>
      ) : (
        // Chromium: functional Install button that fires the native prompt.
        <Button size="sm" className="mt-3 w-full" onClick={() => void handleInstallClick()}>
          {t('install.banner.install')}
        </Button>
      )}
    </div>
  );
}