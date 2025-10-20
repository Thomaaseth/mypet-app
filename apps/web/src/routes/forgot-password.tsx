import { createFileRoute, redirect } from '@tanstack/react-router'
import ForgotPasswordForm from '@/components/ui/auth/ForgotPasswordForm';
import { authClient } from '@/lib/auth-client';

function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ForgotPasswordForm />
    </div>
  );
}

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    
    if (session.data?.user) {
      throw redirect({ to: '/' });
    }
  },
});