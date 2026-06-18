import { createFileRoute } from '@tanstack/react-router'
import { PetListSkeleton } from '@/components/ui/skeletons/PetSkeleton'
import { VetListSkeleton } from '@/components/ui/skeletons/VetSkeleton';

export const Route = createFileRoute('/dev-skeletons')({
  component: RouteComponent,
})

function RouteComponent() {
  // return <VetListSkeleton />
  return <PetListSkeleton />
}
