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

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <SessionProvider>
      <UserPreferencesProvider>
        <NetworkStatusBanner />
          <Navbar />
          <PreferenceBanner />
          <main className="min-h-screen">
            <Outlet />
          </main>
          <Toaster position="bottom-right" />
          {/* Only show devtools in development */}
          {import.meta.env.DEV && <TanStackRouterDevtools />}
      </UserPreferencesProvider>
    </SessionProvider>
  )
}