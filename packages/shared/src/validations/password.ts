import { z } from 'zod';
import { key } from './i18n-keys';

export const passwordValidation = z
  .string()
  .min(8, key('auth.validation.passwordMinLength'))
  .max(128, key('auth.validation.passwordMaxLength'))
  .regex(/(?=.*[A-Z])/, key('auth.validation.passwordUppercase'))
  .regex(/(?=.*[a-z])/, key('auth.validation.passwordLowercase'))
  .regex(/(?=.*\d)/, key('auth.validation.passwordNumber'))
  .regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, key('auth.validation.passwordSpecialChar'));

export const createPasswordConfirmSchema = (passwordFieldName: string = 'password') => {
  return z.object({
    [passwordFieldName]: passwordValidation,
    confirmPassword: z.string().min(1, key('auth.validation.confirmPasswordRequired')),
  }).refine(data => data[passwordFieldName] === data.confirmPassword, {
    message: key('auth.validation.passwordsDoNotMatch'),
    path: ["confirmPassword"],
  });
};

export const newPasswordBaseSchema = z.object({
    newPassword: passwordValidation,
    confirmPassword: z.string().min(1, key('auth.validation.confirmPasswordRequired')),
  });

  export const newPasswordSchema = newPasswordBaseSchema.refine(
    data => data.newPassword === data.confirmPassword, 
    {
      message: key('auth.validation.passwordsDoNotMatch'),
      path: ["confirmPassword"],
    }
  );
  
  export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, key('auth.validation.currentPasswordRequired')),
  }).merge(newPasswordBaseSchema).refine(
    data => data.newPassword === data.confirmPassword,
    {
      message: key('auth.validation.passwordsDoNotMatch'), 
      path: ["confirmPassword"],
    }
  );
  
  export const signUpPasswordSchema = z.object({
    password: passwordValidation,
  });