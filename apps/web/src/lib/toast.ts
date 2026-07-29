import { toast } from 'sonner';
import type { TFunction } from 'i18next';

export const toastService = {
  success: (message: string, description?: string) => {
    return toast.success(message, {
      description,
      duration: 5000,
    });
  },

  error: (message: string, description?: string) => {
    return toast.error(message, {
      description,
      duration: 6000, // Longer duration for errors so users can read them
    });
  },

  info: (message: string, description?: string) => {
    return toast.info(message, {
      description,
      duration: 4000,
    });
  },

  emailSent: (message: string, description?: string) => {
    return toast.success(message, {
      description,
      duration: 5000,
    });
  },

promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
      duration: 4000,
    });
  },

auth: {
    signUpSuccess: (t: TFunction) => 
      toastService.emailSent(
        t('toasts.auth.signUpSuccessTitle'),
        t('toasts.auth.signUpSuccessDescription')
      ),

    signInSuccess: (t: TFunction) => 
      toastService.success(t('toasts.auth.signInSuccess')),

    passwordChanged: (t: TFunction) => 
      toastService.success(t('toasts.auth.passwordChanged')),

    emailUpdated: (isVerified: boolean, t: TFunction) => 
      isVerified 
        ? toastService.emailSent(
            t('toasts.auth.emailUpdateInitiatedTitle'),
            t('toasts.auth.emailUpdateInitiatedDescription')
          )
        : toastService.success(t('toasts.auth.emailUpdatedSuccess')),

    verificationSent: (t: TFunction) => 
      toastService.emailSent(
        t('toasts.auth.verificationSentTitle'),
        t('toasts.auth.verificationSentDescription')
      ),

    passwordResetSent: (t: TFunction) => 
      toastService.emailSent(
        t('toasts.auth.passwordResetSentTitle'),
        t('toasts.auth.passwordResetSentDescription')
      ),

    passwordResetSuccess: (t: TFunction) => 
      toastService.success(
        t('toasts.auth.passwordResetSuccessTitle'),
        t('toasts.auth.passwordResetSuccessDescription')
        ),
  },
}

export { toast };