import type { ApiErrorContext } from './types';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly context?: ApiErrorContext;
  public readonly timestamp: string;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'API_ERROR',
    context?: ApiErrorContext
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  getDebugInfo(): string {
    if (!this.context) return this.message;

    return `
API Error Debug Info:
- Message: ${this.message}
- Status: ${this.status}
- Code: ${this.code}
- Timestamp: ${this.timestamp}
- URL: ${this.context.url}
- Method: ${this.context.method}
- Request Body: ${JSON.stringify(this.context.requestBody, null, 2)}
- Response Body: ${JSON.stringify(this.context.responseBody, null, 2)}
- Correlation ID: ${this.context.correlationId || 'N/A'}
    `.trim();
  }

  toLogData(): ErrorLogData {
    return {
        message: this.message,
        status: this.status,
        code: this.code,
        timestamp: this.timestamp,
        stack: this.stack,
        context: this.context,
    };
  }
}

interface ErrorLogData {
    message: string;
    status: number;
    code: string;
    timestamp: string;
    stack?: string;
    context?: ApiErrorContext;
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', context?: ApiErrorContext) {
    super(message, 400, 'BAD_REQUEST', context);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required', context?: ApiErrorContext) {
    super(message, 401, 'UNAUTHORIZED', context);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', context?: ApiErrorContext) {
    super(message, 403, 'FORBIDDEN', context);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', context?: ApiErrorContext) {
    super(message, 404, 'NOT_FOUND', context);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  public readonly field?: string;

  constructor(
    message: string = 'Validation failed', 
    field?: string, 
    context?: ApiErrorContext
  ) {
    super(message, 422, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network error', context?: ApiErrorContext) {
    super(message, 0, 'NETWORK_ERROR', context);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timeout', context?: ApiErrorContext) {
    super(message, 408, 'TIMEOUT_ERROR', context);
    this.name = 'TimeoutError';
  }
}

export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error', status: number = 500, context?: ApiErrorContext) {
    super(message, status, 'SERVER_ERROR', context);
    this.name = 'ServerError';
  }
}

export function createApiError(
  message: string,
  status: number,
  context?: ApiErrorContext
): ApiError {
  switch (status) {
    case 400:
      return new BadRequestError(message, context);
    case 401:
      return new UnauthorizedError(message, context);
    case 403:
      return new ForbiddenError(message, context);
    case 404:
      return new NotFoundError(message, context);
    case 408:
      return new TimeoutError(message, context);
    case 422:
      return new ValidationError(message, undefined, context);
    default:
      if (status >= 500) {
        return new ServerError(message, status, context);
      }
      return new ApiError(message, status, 'API_ERROR', context);
  }
}

export function logApiError(error: ApiError): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 API Error: ${error.code}`);
    console.error(error.getDebugInfo());
    console.groupEnd();
  }
}