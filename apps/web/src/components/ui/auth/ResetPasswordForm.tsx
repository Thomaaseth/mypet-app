import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { useErrorState } from '@/hooks/useErrorsState';
import { authErrorHandler } from '@/lib/errors/handlers';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { createTranslatedNewPasswordSchema } from '@/lib/validations/password-translated';
import { toastService } from '@/lib/toast';
import { ErrorText } from '@/components/ui/typography';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { TFunction } from 'i18next';

type ResetPasswordFormData = z.infer<ReturnType<typeof createTranslatedNewPasswordSchema>>;

interface ResetPasswordFormProps {
    token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const { t } = useTranslation();
    const newPasswordSchema = useMemo(() => createTranslatedNewPasswordSchema(t), [t]);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { isLoading, error, executeAction } = useErrorState();
  
    const form = useForm<ResetPasswordFormData>({
      resolver: zodResolver(newPasswordSchema ),
      defaultValues: {
        newPassword: '',
        confirmPassword: '',
      },
    });
  
    const onSubmit = async (data: ResetPasswordFormData) => {
      const result = await executeAction(
        async () => {
          const response = await authClient.resetPassword({
            newPassword: data.newPassword,
            token: token,
          });
  
          if ('error' in response && response.error) {
            throw response.error;
          }
  
          return response;
        },
        authErrorHandler
      );
  
      if (result) {
        toastService.auth.passwordResetSuccess();
        navigate({ to: '/login' });
      }
    };

    return (
        <Card className="w-full max-w-md">
          <CardHeader>
          <CardTitle>{t('auth.resetPassword.title')}</CardTitle>
            <CardDescription>
            {t('auth.resetPassword.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}
  
              {/* New Password */}
              <div className="space-y-2">
              <Label htmlFor="newPassword">{t('auth.resetPassword.newPasswordLabel')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                    {...form.register('newPassword')}
                    aria-invalid={!!form.formState.errors.newPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.newPassword && (
                  <ErrorText>{form.formState.errors.newPassword.message}</ErrorText>
                )}
              </div>
  
              {/* Confirm Password */}
              <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPasswordLabel')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                    {...form.register('confirmPassword')}
                    aria-invalid={!!form.formState.errors.confirmPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <ErrorText>{form.formState.errors.confirmPassword.message}</ErrorText>
                )}
              </div>
  
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.resetPassword.submitting')}
                  </>
                ) : (
                  t('auth.resetPassword.submit')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
    );
}