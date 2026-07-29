import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '../../../lib/auth-client';
import { useErrorState } from '../../../hooks/useErrorsState';
import { useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toastService } from '@/lib/toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { authErrorHandler } from '../../../lib/errors/handlers';
import { signUpPasswordSchema } from '@/lib/validations/password';
import { PageTitle, MutedText, ErrorText, HelperText } from '@/components/ui/typography';
import { useTranslation } from 'react-i18next';
import { key } from '@/i18n/translation-key';
import type { TranslationKey } from '@/i18n/translation-key';

const signUpSchema = z.object({
  firstName: z.string()
    .min(1, key('auth.validation.firstNameRequired'))
    .max(50, key('auth.validation.firstNameTooLong'))
    .regex(/^[\p{L}\p{N} \-'\.]+$/u, key('auth.validation.firstNameInvalidChars')),
  lastName: z.string()
    .min(1, key('auth.validation.lastNameRequired'))
    .max(50, key('auth.validation.lastNameTooLong'))
    .regex(/^[\p{L}\p{N} \-'\.]+$/u, key('auth.validation.lastNameInvalidChars')),
  email: z.string().email(key('auth.validation.invalidEmail')),
    acceptedTerms: z.boolean().refine((val) => val === true, {
    message: key('auth.validation.mustAcceptTerms'),
  }),
}).merge(signUpPasswordSchema);

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoading, error, clearError, executeAction } = useErrorState();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      acceptedTerms: false,
    },
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
      toastService.auth.signUpSuccess(t);
      // Email verification is required before login, so there's no session yet.
      // Send the user to the verify-email page
      navigate({ to: '/verify-email', search: { email: data.email } });
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
            {errors.firstName && <ErrorText>{t(errors.firstName.message as TranslationKey)}</ErrorText>}
          </div>
          <div className="space-y-2">
          <Label htmlFor="lastName">{t('auth.signup.lastNameLabel')}</Label>
            <Input
              id="lastName"
              placeholder={t('auth.signup.lastNamePlaceholder')}
              {...register('lastName')}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && <ErrorText>{t(errors.lastName.message as TranslationKey)}</ErrorText>}
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
          {errors.email && <ErrorText>{t(errors.email.message as TranslationKey)}</ErrorText>}
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
          {errors.password && <ErrorText>{t(errors.password.message as TranslationKey)}</ErrorText>}
          <HelperText className="text-xs">
          {t('auth.signup.passwordRequirements')}
          </HelperText>
        </div>

        {/* Terms & Privacy acceptance — required before account creation */}
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="acceptedTerms"
              checked={watch('acceptedTerms')}
              onCheckedChange={(checked) => setValue('acceptedTerms', checked === true)}
              className="mt-0.5"
              aria-invalid={!!errors.acceptedTerms}
            />
            <Label htmlFor="acceptedTerms" className="block text-sm font-normal leading-snug">
              {t('auth.signup.acceptTermsPrefix')}{' '}
              <Link
                to="/terms"
                search={{}}
                target="_blank"
                className="underline underline-offset-2 hover:no-underline"
              >
                {t('auth.signup.termsLink')}
              </Link>{' '}
              {t('auth.signup.acceptTermsMiddle')}{' '}
              <Link
                to="/privacy"
                search={{}}
                target="_blank"
                className="underline underline-offset-2 hover:no-underline"
              >
                {t('auth.signup.privacyLink')}
              </Link>
            </Label>
          </div>
          {errors.acceptedTerms && <ErrorText>{t(errors.acceptedTerms.message as TranslationKey)}</ErrorText>}
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