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
  const [isIOSDialogOpen, setIsIOSDialogOpen] = useState(false);

  // Feature is scoped to mobile per product decision — desktop users keep the
  // browser's own install affordance.
  if (!isMobile || !shouldShowBanner) return null;

  const handleInstallClick = async (): Promise<void> => {
    if (platform === 'ios') {
      // No programmatic install on iOS — guide the user through Share flow.
      setIsIOSDialogOpen(true);
      return;
    }
    // Chromium: fire the native prompt. Dismiss on any resolved choice so the
    // banner doesn't linger after the user has decided (appinstalled also
    // hides us on acceptance).
    const outcome = await promptInstall();
    if (outcome !== null) dismiss();
  };

  return (
    <>
      <div
        // Floats just above the footer's measured height, mirroring the cookie
        // banner's positioning contract (--footer-height, published by Footer).
        style={{ bottom: 'calc(var(--footer-height, 0px) + 1rem)' }}
        className="fixed left-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-lg border bg-background p-4 shadow-lg"
      >
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
      </div>

      <ResponsiveDialog
        open={isIOSDialogOpen}
        onOpenChange={setIsIOSDialogOpen}
        title={t('install.ios.title')}
        description={t('install.ios.description')}
      >
        <ol className="flex flex-col gap-4 py-2">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              1
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              {t('install.ios.step1')}
              <Share className="h-4 w-4 shrink-0" />
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              2
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              {t('install.ios.step2')}
              <Plus className="h-4 w-4 shrink-0" />
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              3
            </span>
            <span className="text-sm">{t('install.ios.step3')}</span>
          </li>
        </ol>
      </ResponsiveDialog>
    </>
  );
}