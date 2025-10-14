import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // Check if user has a session
    const sessionResponse = await authClient.getSession()
    
    // If no session, redirect to login
    if (!('data' in sessionResponse) || !sessionResponse.data?.user) {
      console.log(`Route Guard: Blocking access to ${location.pathname} - No session`)
      
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      })
    }
    
    console.log(`Route Guard: Allowing access to ${location.pathname}`)
    
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