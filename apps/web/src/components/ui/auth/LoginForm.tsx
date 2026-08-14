import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '../../../lib/auth-client';
import { useErrorState } from '../../../hooks/useErrorsState';
import { authErrorHandler } from '../../../lib/errors/handlers';
import { useNavigate, useSearch, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { toastService } from '@/lib/toast';
import { useSessionContext } from '@/contexts/SessionContext';
import { PageTitle, MutedText, ErrorText } from '@/components/ui/typography';
import { useTranslation } from 'react-i18next';
import { key } from '@/i18n/translation-key';
import type { TranslationKey } from '@/i18n/translation-key';
import { getAppUrl } from '@/lib/config';

const signInSchema = z.object({
  email: z.string().email(key('auth.validation.invalidEmail')),
  password: z.string().min(1, key('auth.validation.passwordRequired')),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });
  const { refreshSession } = useSessionContext();
  const { isLoading, error, clearError, executeAction } = useErrorState({
    showErrorToast: true,
    toastCriticalOnly: true
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    const result = await executeAction(
      async () => {
        const { error } = await authClient.signIn.email({
          email: data.email,
          password: data.password,
        });

        if (error) {
          // Unverified email => redirect to the verify-email page
          // BETTER-AUTH CONTRACT: 'EMAIL_NOT_VERIFIED' is better-auth's string.
          // If it changes on upgrade, this branch silently stops firing and
          // unverified users get a raw error instead of the redirect. Re-verify
          // after any better-auth version bump.          
          if (error.code === 'EMAIL_NOT_VERIFIED') {
            // Proactively send a fresh verification email on this redirect, so
            // a user who never got the original (spam/delay) doesn't land on a
            // page that implies mail is coming when none was sent.
            // Fire-and-forget: never block or fail the redirect on the send 
            // Backend quota (5/hr) + IP limit (3/15min) cap abuse.
            void authClient.sendVerificationEmail({
              email: data.email,
              callbackURL: getAppUrl(),
            }).catch(() => {
              // the verify-email page handles recovery via its
              // resend button. A failed proactive send must not disrupt the
              // user's redirect or show an error.
            });
            navigate({ to: '/verify-email', search: { email: data.email } });
            return null;
          }      
          throw error;
        }

        return { success: true };
      },
      authErrorHandler
    );

    if (result) {
      toastService.auth.signInSuccess(t);
      await refreshSession();
      // Use the redirect param from _authenticated, or default to home
      navigate({ to: search.redirect || '/pets' });
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <PageTitle>{t('auth.login.title')}</PageTitle>
        <MutedText>{t('auth.login.subtitle')}</MutedText>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-2">
        <Label htmlFor="email">{t('auth.login.emailLabel')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('auth.login.emailPlaceholder')}
            {...register('email')}
            aria-invalid={!!errors.email}
          />
            {errors.email && <ErrorText>{t(errors.email.message as TranslationKey)}</ErrorText>}
        </div>

        {/* Password */}
        <div className="space-y-2">
        <Label htmlFor="password">{t('auth.login.passwordLabel')}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t('auth.login.passwordPlaceholder')}
            {...register('password')}
            aria-invalid={!!errors.password}
          />
            {errors.password && <ErrorText>{t(errors.password.message as TranslationKey)}</ErrorText>}
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
                {t('auth.login.dismiss')}
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
          >
            {t('auth.login.forgotPassword')}
          </Link>
        </div>
      </form>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
        {t('auth.login.noAccount')}{' '}
          <Link
            to="/signup"
            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            {t('auth.login.signUpLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}