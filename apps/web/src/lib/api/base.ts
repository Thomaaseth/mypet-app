import { getApiUrl } from '@/lib/config';
import type { 
  ApiSuccessResponse, 
  ApiErrorResponse, 
  ApiRequestConfig, 
  ApiClientResponse,
  ApiErrorContext,
  RequestBody
} from './types';
import { 
  createApiError, 
  NetworkError, 
  TimeoutError,
  ApiError 
} from './errors';

// Base API configuration
const API_BASE_URL = getApiUrl();
const DEFAULT_TIMEOUT = 30000; // 30 seconds

export async function makeApiRequest<TResponse = unknown>(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<ApiClientResponse<TResponse>> {
  const {
    method = 'GET',
    body,
    params,
    timeout = DEFAULT_TIMEOUT,
    headers: customHeaders = {},
    ...restConfig
  } = config;

  // Build URL with query parameters
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // Prepare request body
  let requestBody: BodyInit | undefined;
  if (body && method !== 'GET') {
    if (body instanceof FormData || body instanceof URLSearchParams) {
      requestBody = body;
      // Remove Content-Type for FormData to let browser set boundary
      if (body instanceof FormData) {
        delete (headers as Record<string, string>)['Content-Type'];
      }
    } else if (typeof body === 'string') {
      requestBody = body;
    } else if (typeof body === 'object' && body !== null) {
      requestBody = JSON.stringify(body);
    }
  }

  // Create error context for debugging
  const errorContext: ApiErrorContext = {
    url: url.toString(),
    method,
    requestBody: body,
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: requestBody,
      credentials: 'include', // Include cookies for better-auth
      signal: controller.signal,
      ...restConfig,
    });

    clearTimeout(timeoutId);

    // Parse response
    const responseData = await parseApiResponse<TResponse>(response, errorContext);
    
    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };

  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle different error types
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TimeoutError(`Request timeout after ${timeout}ms`, errorContext);
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network connection failed', errorContext);
    }

    // Unknown error
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR',
      errorContext
    );
  }
}

export async function makeAuthenticatedRequest<TResponse = unknown>(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<ApiClientResponse<TResponse>> {
  try {
    return await makeApiRequest<TResponse>(endpoint, config);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // Handle authentication errors - could trigger logout logic here
      console.warn('Authentication failed - user may need to log in again');
    }
    throw error;
  }
}


async function parseApiResponse<TResponse>(
  response: Response,
  context: ApiErrorContext
): Promise<TResponse> {
  let responseBody: unknown;
  
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
    throw new ApiError(
      'Invalid JSON response from server',
      response.status,
      'PARSE_ERROR',
      { ...context, status: response.status }
    );
  }

  if (!response.ok) {
    const errorMessage = isApiErrorResponse(responseBody) 
      ? responseBody.error 
      : `HTTP ${response.status}: ${response.statusText}`;
    
    const errorResponseBody = isApiErrorResponse(responseBody) ? responseBody : undefined;
    
    throw createApiError(
      errorMessage,
      response.status,
      { ...context, status: response.status, responseBody: errorResponseBody }
    );
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

export async function get<TResponse = unknown>(
  endpoint: string,
  params?: Record<string, string | number>,
  config?: Omit<ApiRequestConfig, 'method' | 'params'>
): Promise<TResponse> {
  const response = await makeAuthenticatedRequest<TResponse>(endpoint, {
    method: 'GET',
    params,
    ...config,
  });
  return response.data;
}

export async function post<TResponse = unknown, TBody = RequestBody>(
  endpoint: string,
  body?: TBody,
  config?: Omit<ApiRequestConfig, 'method' | 'body'>
): Promise<TResponse> {
  const response = await makeAuthenticatedRequest<TResponse>(endpoint, {
    method: 'POST',
    body: body as RequestBody,
    ...config,
  });
  return response.data;
}

export async function put<TResponse = unknown, TBody = RequestBody>(
  endpoint: string,
  body?: TBody,
  config?: Omit<ApiRequestConfig, 'method' | 'body'>
): Promise<TResponse> {
  const response = await makeAuthenticatedRequest<TResponse>(endpoint, {
    method: 'PUT',
    body: body as RequestBody,
    ...config,
  });
  return response.data;
}

export async function del<TResponse = unknown>(
  endpoint: string,
  config?: Omit<ApiRequestConfig, 'method'>
): Promise<TResponse> {
  const response = await makeAuthenticatedRequest<TResponse>(endpoint, {
    method: 'DELETE',
    ...config,
  });
  return response.data;
}