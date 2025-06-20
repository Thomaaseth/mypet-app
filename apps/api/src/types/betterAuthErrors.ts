export interface BetterAuthError {
    status?: string;
    statusCode?: number;
    body?: {
        code?: string;
        message?: string;
    };
    message?: string;
}

export function isBetterAuthError(error: unknown): error is BetterAuthError {
    return (
        typeof error === 'object' &&
        error !== null &&
        ('statusCode' in error || 'status' in error || 'body' in error)
    );
}

export function extractErrorDetails(error: unknown): { statusCode: number; message: string } {
    // Handle Better Auth errors
    if (isBetterAuthError(error)) {
      const statusCode = error.statusCode || 400;
      const message = error.body?.message || error.message || 'Authentication failed';
      return { statusCode, message };
    }
  
    // Handle standard Error objects
    if (error instanceof Error) {
      return { statusCode: 400, message: error.message };
    }
  
    // Handle string errors
    if (typeof error === 'string') {
      return { statusCode: 400, message: error };
    }
  
    // Fallback for unknown error types
    return { statusCode: 500, message: 'An unexpected error occurred' };
  }
