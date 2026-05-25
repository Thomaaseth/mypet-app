import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/queries/session'
import { routeLogger } from '@/lib/logger';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location, context }) => {
    // Cache-first: only hits the network if data is missing or stale
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions)

    if (!user) {
      routeLogger.info('Unauthenticated access blocked — redirecting to login', { path: location.pathname });
      throw redirect({ to: '/login', search: { redirect: location.pathname } })
    }

    routeLogger.debug('Authenticated access granted', { path: location.pathname });
    return { user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}