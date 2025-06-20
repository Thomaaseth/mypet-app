import { AppError } from './types';

export const authErrorHandler = (error: any): AppError => {
  const message = error?.body?.message || error?.message || 'An authentication error occurred';
  console.log('Auth Error Debug:', { error, message }); // Temporary debug log

  // Better-auth specific error mapping
  if (message.includes('email')) {
    if (message.includes('already exists') || message.includes('in use')) {
      return { 
        message: 'An account with this email already exists', 
        field: 'email',
        code: 'EMAIL_EXISTS'
      };
    }
    if (message.includes('not found') || message.includes('invalid')) {
      return { 
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      };
    }
  }

  if (message.includes('password')) {
    if (message.includes('uppercase') || message.includes('lowercase') || 
        message.includes('number') || message.includes('special')) {
      return { 
        message, 
        field: 'password',
        code: 'WEAK_PASSWORD'
      };
    }
    if (message.includes('incorrect') || message.includes('invalid')) {
      return { 
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      };
    }
  }

  // Default auth error
  return { 
    message,
    code: 'AUTH_ERROR'
  };
};