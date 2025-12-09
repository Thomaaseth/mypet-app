import { createLazyFileRoute } from '@tanstack/react-router';
import VetList from '@/components/vets/VetList';

export const Route = createLazyFileRoute('/_authenticated/vets')({
  component: VetsPage,
});

function VetsPage() {
  return <VetList />;
}