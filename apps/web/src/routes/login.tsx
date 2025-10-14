import { createFileRoute, redirect } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || '/pets',
    }
  },
  beforeLoad: async () => {
    // If already logged in, redirect to pets
    const sessionResponse = await authClient.getSession()
    
    if ('data' in sessionResponse && sessionResponse.data?.user) {
      throw redirect({ to: '/pets' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-center">Sign in to Pettr</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Login page - Will integrate your existing form next
          </p>
          {search.redirect && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              You&aposll be redirected to: {search.redirect}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}