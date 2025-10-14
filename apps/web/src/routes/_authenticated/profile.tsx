import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  // Access user data from the layout
  const { user } = Route.useRouteContext()
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">My Profile</h1>
      <p className="text-muted-foreground mt-2">Welcome, {user.name}!</p>
      <p className="text-sm text-muted-foreground">Email: {user.email}</p>
    </div>
  )
}