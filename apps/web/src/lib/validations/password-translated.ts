import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Client-only, translated mirror of the password rules in
 * packages/shared/src/validations/password.ts (`passwordValidation`).
 * That shared schema is used by apps/api too, where there's no i18next
 * instance to translate against — so it must stay in plain English there.
 * This is a deliberate, contained duplication: if the password rules
 * (length, character requirements) ever change, both this file and
 * packages/shared/src/validations/password.ts need updating together.
 */
export const createTranslatedPasswordValidation = (t: TFunction) =>
  z
    .string()
    .min(8, t('auth.validation.passwordMinLength'))
    .max(128, t('auth.validation.passwordMaxLength'))
    .regex(/(?=.*[A-Z])/, t('auth.validation.passwordUppercase'))
    .regex(/(?=.*[a-z])/, t('auth.validation.passwordLowercase'))
    .regex(/(?=.*\d)/, t('auth.validation.passwordNumber'))
    .regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, t('auth.validation.passwordSpecialChar'));

export const createTranslatedSignUpPasswordSchema = (t: TFunction) =>
  z.object({
    password: createTranslatedPasswordValidation(t),
  });

  export const createTranslatedNewPasswordSchema = (t: TFunction) =>
    z.object({
      newPassword: createTranslatedPasswordValidation(t),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
    }).refine(
      (data) => data.newPassword === data.confirmPassword,
      {
        message: t('auth.validation.passwordsDoNotMatch'),
        path: ['confirmPassword'],
      }
    );