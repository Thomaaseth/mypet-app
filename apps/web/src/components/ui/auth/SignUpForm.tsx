import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '../../../lib/auth-client';
import { useErrorState } from '../../../hooks/useErrorsState';
import { useNavigate, useSearch, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastService } from '@/lib/toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { authErrorHandler } from '../../../lib/errors/handlers';
import { signUpPasswordSchema } from '@/lib/validations/password';
import { useSessionContext } from '@/contexts/SessionContext';
import { PageTitle, MutedText, ErrorText, HelperText } from '@/components/ui/typography';

const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
}).merge(signUpPasswordSchema);

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/signup' });
  const { refreshSession } = useSessionContext();
  const { isLoading, error, clearError, executeAction } = useErrorState();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    const result = await executeAction(
      async () => {
        const { error: signUpError } = await authClient.signUp.email({
          email: data.email,
          password: data.password,
          name: `${data.firstName} ${data.lastName}`,
        });

        if (signUpError) {
          throw signUpError;
        }

        return { success: true };
      },
      authErrorHandler
    );

    if (result) {
      toastService.auth.signUpSuccess();
      await refreshSession();
      // Use the redirect param from _authenticated, or default to home
      navigate({ to: search.redirect || '/' });
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <PageTitle>Create an account</PageTitle>
        <MutedText>Enter your information to get started with Pettr.</MutedText>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* First Name & Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              placeholder='Enter your first name'
              {...register('firstName')}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && <ErrorText>{errors.firstName.message}</ErrorText>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              placeholder='Enter your last name'
              {...register('lastName')}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && <ErrorText>{errors.lastName.message}</ErrorText>}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register('password')}
            aria-invalid={!!errors.password}
          />
          {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
          <HelperText className="text-xs">
             Must be 8-128 characters with uppercase, lowercase, number, and special character
          </HelperText>
        </div>

        {/* Auth Error Display with shadcn Alert */}
        {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                {error.message}
                <button 
                  type="button" 
                  onClick={clearError}
                  className="text-xs hover:underline ml-4"
                >
                  Dismiss
                </button>
              </AlertDescription>
            </Alert>
          )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}