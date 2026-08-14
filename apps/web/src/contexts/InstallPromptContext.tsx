import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useInstallPrompt, type InstallPlatform } from '@/hooks/useInstallPrompt';
import { useCookieConsentContext } from '@/contexts/CookieConsentContext';
import { installLogger } from '@/lib/logger';
import { isSnoozed } from '@/lib/install/detection';

const INSTALL_PROMPT_STORAGE_KEY = 'pettr-install-prompt';

interface InstallPromptPersistedState {
  dismissedAt: number | null;
}

const DEFAULT_STATE: InstallPromptPersistedState = {
  dismissedAt: null,
};

interface InstallPromptContextValue {
  shouldShowBanner: boolean;
  platform: InstallPlatform;
  promptInstall: () => Promise<'accepted' | 'dismissed' | null>;
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
    setState((prev) => ({ ...prev, dismissedAt: Date.now() }));
    installLogger.debug('Install banner dismissed by user');
  }, [setState]);

  // Consent-first ordering, then: never show if already installed/standalone,
  // currently snoozed, or the platform offers no install path we can guide.
  // On Chromium we additionally wait for the native prompt to be captured.
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