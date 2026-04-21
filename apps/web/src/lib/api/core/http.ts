import { getApiUrl } from '@/lib/config';
import { apiLogger } from '@/lib/logger';
import type { 
  ApiRequestConfig, 
  ApiClientResponse,
  ApiErrorContext,
} from '../types';
import { 
  NetworkError, 
  TimeoutError,
  ApiError 
} from '../errors';
import { parseApiResponse } from './parser';
import { queryClient } from '@/lib/queryClient';
import { sessionKeys } from '@/queries/session';

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
    timestamp: new Date().toISOString(),
    correlationId: crypto.randomUUID(),
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
      apiLogger.warn('Unauthenticated API request — session may have expired', { endpoint });
      queryClient.setQueryData(sessionKeys.current, null);
      window.location.href = '/login';
      return new Promise(() => {}); // never resolves — page is redirecting anyway
    }
    throw error;
  }
}