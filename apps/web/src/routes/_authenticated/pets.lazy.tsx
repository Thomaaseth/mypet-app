import { createLazyFileRoute } from '@tanstack/react-router'
import PetList from '@/components/pets/PetList'

export const Route = createLazyFileRoute('/_authenticated/pets')({
  component: PetsPage,
})

function PetsPage() {
  return <PetList />
}