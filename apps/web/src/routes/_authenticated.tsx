import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { routeLogger } from '@/lib/logger';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // Check if user has a session
    const sessionResponse = await authClient.getSession()
    
    // If no session, redirect to login
    if (!('data' in sessionResponse) || !sessionResponse.data?.user) {
      routeLogger.info('Unauthenticated access blocked — redirecting to login', { path: location.pathname });
      
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      })
    }
    
    routeLogger.debug('Authenticated access granted', { path: location.pathname });
    
    // Return user data to be available in child routes
    return {
      user: sessionResponse.data.user,
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}