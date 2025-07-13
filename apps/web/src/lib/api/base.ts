import { makeAuthenticatedRequest } from './core';
import type { ApiRequestConfig, RequestBody } from './types';

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

export { makeApiRequest, makeAuthenticatedRequest } from './core';