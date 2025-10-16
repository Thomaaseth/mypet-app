import { createLazyFileRoute } from '@tanstack/react-router'
import ProfilePage from '@/components/profile/ProfilePage';

export const Route = createLazyFileRoute('/_authenticated/profile')({
  component: ProfilePage,
})
