import type { 
  ApiSuccessResponse, 
  ApiErrorResponse,
  ApiErrorContext
} from '../types';
import { createApiError, ApiError, logApiError } from '../errors';

// Requests tracking
function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function parseApiResponse<TResponse>(
  response: Response,
  context: ApiErrorContext
): Promise<TResponse> {
  let responseBody: unknown;
    
  const enhancedContext: ApiErrorContext = {
    ...context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    correlationId: context.correlationId || generateCorrelationId(),
    status: response.status,
  };

  try {
    const text = await response.text();
    responseBody = text ? JSON.parse(text) : {};
    
    // Type-safe assignment to context
    if (typeof responseBody === 'string') {
      context.responseBody = responseBody;
    } else if (isApiSuccessResponse(responseBody) || isApiErrorResponse(responseBody)) {
      context.responseBody = responseBody;
    } else {
      context.responseBody = String(responseBody);
    }
  } catch {
    const error = new ApiError(
      'Invalid JSON response from server',
      response.status,
      'PARSE_ERROR',
      { ...context, status: response.status }
    );

    logApiError(error);
    throw error;
  }

  if (!response.ok) {
    const errorMessage = isApiErrorResponse(responseBody) 
      ? responseBody.error 
      : `HTTP ${response.status}: ${response.statusText}`;
    
    const errorResponseBody = isApiErrorResponse(responseBody) ? responseBody : undefined;
    enhancedContext.responseBody = errorResponseBody;

    const error = createApiError(errorMessage, response.status, enhancedContext);
    logApiError(error);
    throw error;
  }

  if (isApiSuccessResponse(responseBody)) {
    return responseBody.data as TResponse;
  }

  return responseBody as TResponse;
}

function isApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
  return typeof obj === 'object' && 
         obj !== null && 
         'error' in obj && 
         typeof (obj as Record<string, unknown>).error === 'string';
}

function isApiSuccessResponse<T = unknown>(obj: unknown): obj is ApiSuccessResponse<T> {
  return typeof obj === 'object' && 
         obj !== null && 
         'data' in obj;
}