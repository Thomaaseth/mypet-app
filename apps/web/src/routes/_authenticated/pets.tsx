import { createFileRoute } from '@tanstack/react-router'
import PetList from '@/components/pets/PetList'

export const Route = createFileRoute('/_authenticated/pets')({
  component: PetsPage,
})

function PetsPage() {
  return <PetList />
}