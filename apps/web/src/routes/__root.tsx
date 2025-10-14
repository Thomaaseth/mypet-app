import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { SessionProvider } from '@/contexts/SessionContext'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <SessionProvider>
      <Outlet />
      {/* Only show devtools in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </SessionProvider>
  )
}