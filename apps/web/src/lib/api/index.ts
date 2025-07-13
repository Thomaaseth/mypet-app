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
  logApiError,
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

export { petApi, petErrorHandler } from './domains/pets';

export type { PetsApiResponse, PetError } from './domains/pets';