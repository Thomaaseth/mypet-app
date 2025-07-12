export { apiClient, ApiClient } from './client';
export { 
  makeApiRequest, 
  makeAuthenticatedRequest, 
  get, 
  post, 
  put, 
  del 
} from './base';

export {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  NetworkError,
  TimeoutError,
  ServerError,
  createApiError,
} from './errors';

export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  ApiRequestConfig,
  ApiClientResponse,
  HttpMethod,
  ApiErrorContext,
  RequestBody,
  ExtractApiData,
} from './types';

export { petApi, petErrorHandler } from './pets';

// Re-export for backward compatibility (if needed during migration)
export { petApi as petsApi } from './pets';