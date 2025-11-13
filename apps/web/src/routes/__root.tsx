import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { SessionProvider } from '@/contexts/SessionContext'
import { Navbar } from '@/components/Navbar'
import { Toaster } from '@/components/ui/sonner'
import '../globals.css'
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <SessionProvider>
     <NetworkStatusBanner />
      <Navbar />
        <main className="min-h-screen">
         <Outlet />
        </main>
       <Toaster position="bottom-right" />
      {/* Only show devtools in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </SessionProvider>
  )
}