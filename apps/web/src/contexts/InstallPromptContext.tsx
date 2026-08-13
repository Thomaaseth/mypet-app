import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useInstallPrompt, type InstallPlatform } from '@/hooks/useInstallPrompts';
import { installLogger } from '@/lib/logger';
import { useCookieConsentContext } from '@/contexts/CookieConsentContext';

const INSTALL_PROMPT_STORAGE_KEY = 'pettr-install-prompt';

// Re-show the install banner this long after a dismissal
const INSTALL_SNOOZE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface InstallPromptPersistedState {
  dismissedAt: number | null;
}

const DEFAULT_STATE: InstallPromptPersistedState = {
  dismissedAt: null,
};

function isSnoozed(dismissedAt: number | null): boolean {
  if (dismissedAt === null) return false;
  return Date.now() - dismissedAt < INSTALL_SNOOZE_MS;
}

interface InstallPromptContextValue {
  /** Whether the install banner should render. */
  shouldShowBanner: boolean;
  /** Install strategy for the current platform. */
  platform: InstallPlatform;
  /** Trigger the native install prompt (Chromium only). */
  promptInstall: () => Promise<'accepted' | 'dismissed' | null>;
  /** Persistently dismiss the banner so we don't show on every visit. */
  dismiss: () => void;
}

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null);

interface InstallPromptProviderProps {
  children: ReactNode;
}

export function InstallPromptProvider({ children }: InstallPromptProviderProps) {
  const [state, setState] = useLocalStorage<InstallPromptPersistedState>(
    INSTALL_PROMPT_STORAGE_KEY,
    DEFAULT_STATE
  );
  const { platform, isStandalone, isInstalled, canPromptNatively, promptInstall } =
    useInstallPrompt();
  const { hasConsented } = useCookieConsentContext();
  
  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, dismissed: true }));
    installLogger.debug('Install banner dismissed by user');
  }, [setState]);

  // Never show if already installed/standalone, previously dismissed, or the
  // platform offers no install path we can guide. On
  // Chromium we additionally wait until the native prompt has been captured.
  const shouldShowBanner =
    hasConsented &&
    !isStandalone &&
    !isInstalled &&
    !isSnoozed(state.dismissedAt) &&
    (platform === 'ios' || (platform === 'chromium' && canPromptNatively));

  const value: InstallPromptContextValue = {
    shouldShowBanner,
    platform,
    promptInstall,
    dismiss,
  };

  return (
    <InstallPromptContext.Provider value={value}>{children}</InstallPromptContext.Provider>
  );
}

export function useInstallPromptContext() {
  const context = useContext(InstallPromptContext);
  if (!context) {
    throw new Error('useInstallPromptContext must be used within an InstallPromptProvider');
  }
  return context;
}