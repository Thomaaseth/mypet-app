import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to Pettr</h1>
        <p className="text-muted-foreground">
          Home Page
        </p>
        <div className="flex gap-4 justify-center">
          <a 
            href="/login" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Login
          </a>
          <a 
            href="/signup"
            className="px-4 py-2 border rounded-md"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  )
}