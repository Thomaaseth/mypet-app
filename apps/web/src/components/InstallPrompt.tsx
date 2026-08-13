import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Share, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useInstallPromptContext } from '@/contexts/InstallPromptContext';

export function InstallPrompt() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { shouldShowBanner, platform, promptInstall, dismiss } = useInstallPromptContext();

  // Feature is scoped to mobile
  if (!isMobile || !shouldShowBanner) return null;

  const handleInstallClick = async (): Promise<void> => {
    // Chromium: fire the native prompt. Dismiss on any resolved choice so the
    // banner doesn't linger after the user has decided (appinstalled also
    // hides us on acceptance).
    const outcome = await promptInstall();
    if (outcome !== null) dismiss();
  };

  return (
    <div
      // Pinned to the viewport bottom (not the footer), with safe-area padding
      // so it clears the iOS home indicator. Full-bleed bar on mobile.
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background px-4 py-3 shadow-lg"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      {platform === 'ios' ? (
        // iOS: no programmatic install exists — a single instruction line is
        // all the user needs. No button (nothing to trigger), no dialog.
        <div className="flex items-center gap-2">
          <Share className="h-5 w-5 shrink-0 text-foreground" />
          <span className="flex-1 text-sm text-foreground">
            {t('install.banner.iosInstruction')}
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('install.banner.dismiss')}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Chromium (Android/desktop): the Install button fires the browser's
        // native install prompt — this path is functional, not instructional.
        <>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 text-sm text-foreground">
              <Download className="mt-0.5 h-4 w-4 shrink-0" />
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

          <Button size="sm" className="w-full" onClick={() => void handleInstallClick()}>
            {t('install.banner.install')}
          </Button>
        </>
      )}
    </div>