import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { SessionProvider } from '@/contexts/SessionContext'
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
            <div
              className="min-h-screen flex flex-col"
              style={{ paddingBottom: 'var(--cookie-consent-reserved-height, 0px)' }}
            >
              <NetworkStatusBanner />
              <Navbar />
              <PreferenceBanner />
              <main className="flex-1">
                <Outlet />
              </main>
              <Footer />
            </div>
            <CookieConsentBanner />
            <Toaster position="bottom-right" />
            {/* Only show devtools in development */}
            {import.meta.env.DEV && <TanStackRouterDevtools />}
          </CookieConsentProvider>
        </UserPreferencesProvider>
      </SessionProvider>
    </LanguageProvider>
  )
}