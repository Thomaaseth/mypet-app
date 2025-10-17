import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import ResetPasswordForm from '@/components/ui/auth/ResetPasswordForm';

// Define search params - token is required
const resetPasswordSearchSchema = z.object({
  token: z.string(),
});

export const Route = createFileRoute('/reset-password')({
  validateSearch: resetPasswordSearchSchema,
  // Redirect to forgot-password if no token
  beforeLoad: ({ search }) => {
    if (!search.token) {
      throw redirect({
        to: '/forgot-password',
      });
    }
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ResetPasswordForm token={token} />
    </div>
  );
}