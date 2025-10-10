import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/pets')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/pets"!</div>
}
