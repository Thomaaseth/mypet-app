import { createFileRoute, redirect } from '@tanstack/react-router';
import SignUpForm from '@/components/ui/auth/SignUpForm';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';

const signupSearchSchema = z.object({
  redirect: z.string().optional(),
});

function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignUpForm />
    </div>
  );
}

export const Route = createFileRoute('/signup')({
  component: SignupPage,
  validateSearch: signupSearchSchema,
  beforeLoad: async () => {
    // check is user is already logged in
    const session = await authClient.getSession();

    if (session.data?.user) {
      throw redirect({ to: '/' });
    }
  }
});
