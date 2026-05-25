import { createFileRoute, redirect } from '@tanstack/react-router'
import ForgotPasswordForm from '@/components/ui/auth/ForgotPasswordForm';
import { sessionQueryOptions } from '@/queries/session'

function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ForgotPasswordForm />
    </div>
  );
}

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (user) throw redirect({ to: '/' })
  },
});