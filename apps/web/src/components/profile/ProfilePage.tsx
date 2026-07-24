import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { useErrorState } from '@/hooks/useErrorsState';
import { useSessionContext } from '@/contexts/SessionContext';
import { authErrorHandler } from '@/lib/errors/handlers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toastService } from '@/lib/toast';
import { Loader2, AlertCircle, Mail, Lock, Eye, EyeOff, CheckCircle, Globe } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { createTranslatedPasswordChangeSchema } from '@/lib/validations/password-translated';
import type { TFunction } from 'i18next';
import { 
  AccountInfoSkeleton, 
  EmailFormSkeleton, 
  PasswordFormSkeleton,
  PreferencesCardSkeleton
} from '@/components/ui/skeletons/ProfileSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { useUpsertUserPreferences } from '@/queries/user-preferences';
import { DATE_TIME_LOCALE_OPTIONS, UNIT_SYSTEM_OPTIONS } from '@/lib/constants/locale-options';
import { detectBrowserTimezone } from '@/lib/utils/timezone';
import { getFallbackDateTimeLocale, getFallbackUnitSystem } from '@/lib/utils/locale';
import { PreferenceOptionButton } from '@/components/ui/preference-option-button';
import { useTranslation } from 'react-i18next';
import {
  DATE_TIME_LOCALE_LABEL_KEYS,
  DATE_TIME_LOCALE_DESCRIPTION_KEYS,
  UNIT_SYSTEM_LABEL_KEYS,
  UNIT_SYSTEM_DESCRIPTION_KEYS,
} from '@/i18n/enum-keys';

// Component-local schema (not shared with API) — factory pattern so
// the validation message can be translated via t()
const createEmailUpdateSchema = (t: TFunction) =>
  z.object({
    newEmail: z.string().email(t('auth.validation.invalidEmail')),
  });

type PasswordChangeFormData = z.infer<ReturnType<typeof createTranslatedPasswordChangeSchema>>;
type EmailUpdateFormData = z.infer<ReturnType<typeof createEmailUpdateSchema>>;

export default function MyProfilePage() {
  const { t } = useTranslation();
  // user session context
  const { user: currentUser, isLoading: isLoadingUser, error: sessionError, updateUser } = useSessionContext();
  const { dateTimeLocale: currentDateTimeLocale, unitSystem: currentUnitSystem, isLoading: isLoadingPreferences } = usePreferencesContext();
  const { mutate: upsertPreferences, isPending: isSavingPreferences, variables: pendingPreferences } = useUpsertUserPreferences();

  const emailUpdateSchema = useMemo(() => createEmailUpdateSchema(t), [t]);
  const passwordChangeSchema = useMemo(() => createTranslatedPasswordChangeSchema(t), [t]);

  // UI-specific state remains as separate useState
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Email update form
  const emailUpdateState = useErrorState();
  const emailForm = useForm<EmailUpdateFormData>({
    resolver: zodResolver(emailUpdateSchema),
    defaultValues: {
      newEmail: currentUser?.email || '',
    },
  });

  // Password change form
  const passwordChangeState = useErrorState();
  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Sync email form when user data loads
  useEffect(() => {
    if (currentUser?.email && emailForm.getValues('newEmail') !== currentUser.email) {
      emailForm.setValue('newEmail', currentUser.email);
    }
  }, [currentUser?.email, emailForm]);

  // Handle email update using Better Auth's native changeEmail
  const onEmailUpdate = async (data: EmailUpdateFormData) => {
    const result = await emailUpdateState.executeAction(
      async () => {
        const response = await authClient.changeEmail({
          newEmail: data.newEmail,
          callbackURL: '/profile',
        });

        if ('error' in response && response.error) {
          throw response.error;
        }

        return response;
      },
      authErrorHandler
    );

    if (result) {
      toastService.auth.emailUpdated(currentUser?.emailVerified || false, t);

      // Use updateUser 
      if (!currentUser?.emailVerified) {
        updateUser({ email: data.newEmail });
      }
    }

    return result;
  };

  // Handle password change using Better Auth's native changePassword
  const onPasswordChange = async (data: PasswordChangeFormData) => {
    const result = await passwordChangeState.executeAction(
      async () => {
        const response = await authClient.changePassword({
          newPassword: data.newPassword,
          currentPassword: data.currentPassword,
          revokeOtherSessions: false,
        });

        if ('error' in response && response.error) {
          throw response.error;
        }

        return response;
      },
      authErrorHandler
    );

    if (result) {
      passwordForm.reset();
      toastService.auth.passwordChanged(t);
    }

    return result;
  };

  // Toggle functions for password visibility
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Loading state is managed by the hook
  if (isLoadingUser) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="space-y-8">
          <AccountInfoSkeleton />
          <EmailFormSkeleton />
          <PasswordFormSkeleton />
          <PreferencesCardSkeleton />
        </div>
      </div>
    );
  }

  // Error state is managed by the hook
  if (sessionError) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('profile.account.loadError')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // User will always exist here due to redirect logic in hook
  if (!currentUser) return null;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="space-y-8">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('profile.account.title')}
            </CardTitle>
            <CardDescription>
              {t('profile.account.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('profile.account.nameLabel')}</Label>
                <p className="text-sm font-medium">{currentUser.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('profile.account.emailLabel')}</Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{currentUser.email}</p>
                  {currentUser.emailVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                {!currentUser.emailVerified && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('profile.account.emailNotVerified')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date/Time Format & Units */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('profile.preferencesCard.title')}
            </CardTitle>
            <CardDescription>
              {t('profile.preferencesCard.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPreferences ? (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Skeleton className="h-16 flex-1" />
                  <Skeleton className="h-16 flex-1" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-16 flex-1" />
                  <Skeleton className="h-16 flex-1" />
                </div>
              </div>
            ) : (
              <>
                {/* Date/Time format */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {DATE_TIME_LOCALE_OPTIONS.map(({ dateTimeLocale }) => {
                    const isActive = currentDateTimeLocale === dateTimeLocale;
                    return (
                      <PreferenceOptionButton
                        key={dateTimeLocale}
                        label={t(DATE_TIME_LOCALE_LABEL_KEYS[dateTimeLocale])}
                        description={t(DATE_TIME_LOCALE_DESCRIPTION_KEYS[dateTimeLocale])}
                        isActive={isActive}
                        disabled={isSavingPreferences}
                        isSaving={isSavingPreferences && !isActive && pendingPreferences?.dateTimeLocale === dateTimeLocale}
                        onClick={() => {
                          if (!isActive) upsertPreferences({
                            dateTimeLocale,
                            unitSystem: currentUnitSystem ?? getFallbackUnitSystem(),
                            timezone: detectBrowserTimezone(),
                          });
                        }}
                      />
                    );
                  })}
                </div>

                {/* Units */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {UNIT_SYSTEM_OPTIONS.map(({ unitSystem }) => {
                    const isActive = currentUnitSystem === unitSystem;
                    return (
                      <PreferenceOptionButton
                        key={unitSystem}
                        label={t(UNIT_SYSTEM_LABEL_KEYS[unitSystem])}
                        description={t(UNIT_SYSTEM_DESCRIPTION_KEYS[unitSystem])}
                        isActive={isActive}
                        disabled={isSavingPreferences}
                        isSaving={isSavingPreferences && !isActive && pendingPreferences?.unitSystem === unitSystem}
                        onClick={() => {
                          if (!isActive) upsertPreferences({
                            dateTimeLocale: currentDateTimeLocale ?? getFallbackDateTimeLocale(),
                            unitSystem,
                            timezone: detectBrowserTimezone(),
                          });
                        }}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Email Update Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('profile.emailForm.title')}
            </CardTitle>
            <CardDescription>
              {t('profile.emailForm.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={emailForm.handleSubmit(onEmailUpdate)} className="space-y-4">
              {emailUpdateState.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {emailUpdateState.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newEmail">{t('profile.emailForm.newEmailLabel')}</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder={t('profile.emailForm.newEmailPlaceholder')}
                  {...emailForm.register('newEmail')}
                  aria-invalid={!!emailForm.formState.errors.newEmail}
                />
                {emailForm.formState.errors.newEmail && (
                  <p className="text-sm text-destructive">
                    {emailForm.formState.errors.newEmail.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={emailUpdateState.isLoading}
                size="sm"
              >
                {emailUpdateState.isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {emailUpdateState.isLoading ? t('profile.emailForm.submitUpdating') : t('profile.emailForm.submitUpdate')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('profile.passwordForm.title')}
            </CardTitle>
            <CardDescription>
              {t('profile.passwordForm.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-4">
              {passwordChangeState.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {passwordChangeState.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('profile.passwordForm.currentPasswordLabel')}</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={passwordVisibility.current ? "text" : "password"}
                      placeholder={t('profile.passwordForm.currentPasswordPlaceholder')}
                      {...passwordForm.register('currentPassword')}
                      aria-invalid={!!passwordForm.formState.errors.currentPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {passwordVisibility.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('profile.passwordForm.newPasswordLabel')}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={passwordVisibility.new ? "text" : "password"}
                      placeholder={t('profile.passwordForm.newPasswordPlaceholder')}
                      {...passwordForm.register('newPassword')}
                      aria-invalid={!!passwordForm.formState.errors.newPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {passwordVisibility.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('profile.passwordForm.confirmPasswordLabel')}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={passwordVisibility.confirm ? "text" : "password"}
                      placeholder={t('profile.passwordForm.confirmPasswordPlaceholder')}
                      {...passwordForm.register('confirmPassword')}
                      aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {passwordVisibility.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={passwordChangeState.isLoading}
                size="sm"
              >
                {passwordChangeState.isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {passwordChangeState.isLoading ? t('profile.passwordForm.submitChanging') : t('profile.passwordForm.submitChange')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}