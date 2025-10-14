import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/pets')({
  component: PetsPage,
})

function PetsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">My Pets</h1>
      <p className="text-muted-foreground mt-2">
        This page is protected - you must be logged in to see it
      </p>
    </div>
  )
}