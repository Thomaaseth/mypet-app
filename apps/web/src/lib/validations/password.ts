
import { z } from 'zod';

export const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/(?=.*\d)/, 'Password must contain at least one number')
  .regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, 'Password must contain at least one special character');

export const createPasswordConfirmSchema = (passwordFieldName: string = 'password') => {
  return z.object({
    [passwordFieldName]: passwordValidation,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  }).refine(data => data[passwordFieldName] === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
};

export const newPasswordBaseSchema = z.object({
    newPassword: passwordValidation,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  });

  export const newPasswordSchema = newPasswordBaseSchema.refine(
    data => data.newPassword === data.confirmPassword, 
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );
  
  export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
  }).merge(newPasswordBaseSchema).refine(
    data => data.newPassword === data.confirmPassword,
    {
      message: "Passwords do not match", 
      path: ["confirmPassword"],
    }
  );
  
  export const signUpPasswordSchema = z.object({
    password: passwordValidation,
  });