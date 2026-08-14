import { useCallback, useEffect, useState } from 'react';
import { installLogger } from '@/lib/logger';

// `beforeinstallprompt` is a non-standard, Chromium-only event and is not part
// of TypeScript's DOM lib
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

// iOS Safari exposes a non-standard `navigator.standalone` when launched from
// an installed home-screen icon. Also not in lib.dom
type SafariNavigator = Navigator & { standalone?: boolean };

export type InstallPlatform = 'chromium' | 'ios' | 'unsupported';

export interface UseInstallPrompt {
  /** Install strategy available on the current platform. */
  platform: InstallPlatform;
  /** App is already running as an installed PWA: nothing to prompt. */
  isStandalone: boolean;
  /** A native (Chromium) install prompt has been captured and can be fired. */
  canPromptNatively: boolean;
  /** The browser confirmed installation (appinstalled fired this session). */
  isInstalled: boolean;
  /**
   * Fires the Chromium native prompt. Resolves to the user's choice, or
   * `null` when no native prompt is available (e.g. iOS).
   */
  promptInstall: () => Promise<'accepted' | 'dismissed' | null>;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (navigator as SafariNavigator).standalone === true;
  return displayModeStandalone || iosStandalone;
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  // iPhone/iPod always report iOS. iPadOS 13+ masquerades as "Macintosh", so a
  // touch-capable Mac is treated as iOS for install-instruction purposes.
  const ua = navigator.userAgent;
  const isIPhoneOrIPod = /iPhone|iPod/.test(ua);
  const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return isIPhoneOrIPod || isIPad;
}

export function useInstallPrompt(): UseInstallPrompt {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(detectStandalone);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const isIOS = detectIOS();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent): void => {
      // Suppress Chromium's default mini-infobar; we drive the UI ourselves.
      e.preventDefault();
      setDeferredPrompt(e);
      installLogger.debug('Captured beforeinstallprompt', { platforms: [...e.platforms] });
    };

    const handleAppInstalled = (): void => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      installLogger.info('App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Keep standalone state live if display-mode flips mid-session.
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = (): void => setIsStandalone(detectStandalone());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt) {
      installLogger.warn('promptInstall called with no captured prompt');
      return null;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    installLogger.info('Install prompt outcome', { outcome });
    // A captured prompt can only be used once.
    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  const platform: InstallPlatform = deferredPrompt ? 'chromium' : isIOS ? 'ios' : 'unsupported';

  return {
    platform,
    isStandalone,
    canPromptNatively: deferredPrompt !== null,
    isInstalled,
    promptInstall,
  };
}