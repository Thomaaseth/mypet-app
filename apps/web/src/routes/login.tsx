import { createFileRoute } from '@tanstack/react-router';
import LoginForm from '@/components/ui/auth/LoginForm';
import { z } from 'zod';

// Accept the redirect param that _authenticated.tsx sends
const loginSearchSchema = z.object({
    redirect: z.string().optional(),
  });
  

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: loginSearchSchema,
});