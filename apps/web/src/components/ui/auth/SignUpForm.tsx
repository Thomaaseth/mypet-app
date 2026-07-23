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
import { createTranslatedSignUpPasswordSchema } from '@/lib/validations/password-translated';
import { useSessionContext } from '@/contexts/SessionContext';
import { PageTitle, MutedText, ErrorText, HelperText } from '@/components/ui/typography';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const createSignUpSchema = (t: TFunction) =>
  z.object({
    firstName: z.string().min(1, t('auth.validation.firstNameRequired')),
    lastName: z.string().min(1, t('auth.validation.lastNameRequired')),
    email: z.string().email(t('auth.validation.invalidEmail')),
  }).merge(createTranslatedSignUpPasswordSchema(t));

type SignUpFormData = z.infer<ReturnType<typeof createSignUpSchema>>;

export default function SignUpForm() {
  const { t } = useTranslation();
  const signUpSchema = useMemo(() => createSignUpSchema(t), [t]);
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
        <PageTitle>{t('auth.signup.title')}</PageTitle>
        <MutedText>{t('auth.signup.subtitle')}</MutedText>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* First Name & Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
          <Label htmlFor="firstName">{t('auth.signup.firstNameLabel')}</Label>
            <Input
              id="firstName"
              placeholder={t('auth.signup.firstNamePlaceholder')}
              {...register('firstName')}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && <ErrorText>{errors.firstName.message}</ErrorText>}
          </div>
          <div className="space-y-2">
          <Label htmlFor="lastName">{t('auth.signup.lastNameLabel')}</Label>
            <Input
              id="lastName"
              placeholder={t('auth.signup.lastNamePlaceholder')}
              {...register('lastName')}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && <ErrorText>{errors.lastName.message}</ErrorText>}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
        <Label htmlFor="email">{t('auth.signup.emailLabel')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('auth.signup.emailPlaceholder')}
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
        </div>

        {/* Password */}
        <div className="space-y-2">
        <Label htmlFor="password">{t('auth.signup.passwordLabel')}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t('auth.signup.passwordPlaceholder')}
            {...register('password')}
            aria-invalid={!!errors.password}
          />
          {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
          <HelperText className="text-xs">
          {t('auth.signup.passwordRequirements')}
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
                  {t('auth.signup.dismiss')}
                </button>
              </AlertDescription>
            </Alert>
          )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
        {t('auth.signup.haveAccount')}{' '}
          <Link
            to="/login"
            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            {t('auth.signup.signInLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}