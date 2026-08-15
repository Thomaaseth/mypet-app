import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { SessionProvider } from '@/contexts/SessionContext'
import { useSessionContext } from '@/contexts/SessionContext'
import { Navbar } from '@/components/Navbar'
import { Toaster } from '@/components/ui/sonner'
import '../globals.css'
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner'
import type { QueryClient } from '@tanstack/react-query'
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { PreferenceBanner } from '@/components/PreferenceBanner';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
// If you added these during the PWA work, keep your versions/paths:
import { InstallPromptProvider } from '@/contexts/InstallPromptContext';
import { InstallPrompt } from '@/components/InstallPrompt';

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <LanguageProvider>
      <SessionProvider>
        <UserPreferencesProvider>
          <CookieConsentProvider>
            <InstallPromptProvider>
              {/* AppShell lives inside the providers so it can read the
                  session to gate the (logged-in-only) bottom nav. */}
              <AppShell />
              <Toaster position="bottom-right" />
              {/* Only show devtools in development */}
              {/* {import.meta.env.DEV && <TanStackRouterDevtools />} */}
            </InstallPromptProvider>
          </CookieConsentProvider>
        </UserPreferencesProvider>
      </SessionProvider>
    </LanguageProvider>
  )
}

function AppShell() {
  const { user } = useSessionContext();

  return (
    <div className="min-h-dvh flex flex-col">
      <NetworkStatusBanner />
      <Navbar />
      <PreferenceBanner />
      <main className="min-h-dvh sm:min-h-full flex-1 flex flex-col">
        <Outlet />
      </main>
      {/* Sticky bottom nav — flow sibling right before the footer, so it pins
          to the viewport bottom while scrolling and rests above the footer at
          scroll-end. Logged-in only; md:hidden handles desktop. Mounting here
          (not in _authenticated) is what makes it appear on Home too. */}
      <CookieConsentBanner />
      <InstallPrompt />
      {user && <BottomNav />}
      <Footer />
    </div>
  )
}