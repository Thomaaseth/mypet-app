import { makeApiRequest, makeAuthenticatedRequest } from './core';
import type { ApiRequestConfig } from './types';

export class ApiClient {
  async request<TResponse = unknown>(endpoint: string, config?: ApiRequestConfig): Promise<TResponse> {
    const response = await makeAuthenticatedRequest<TResponse>(endpoint, config);
    return response.data;
  }

  async publicRequest<TResponse = unknown>(endpoint: string, config?: ApiRequestConfig): Promise<TResponse> {
    const response = await makeApiRequest<TResponse>(endpoint, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();