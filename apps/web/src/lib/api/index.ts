export { apiClient, ApiClient } from './client';
export { 
  makeApiRequest, 
  makeAuthenticatedRequest, 
  get, 
  post, 
  put, 
  del,
  patch 
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
export { weightApi, weightErrorHandler } from './domains/weights';
export { foodApi, foodErrorHandler } from './domains/food';
export { vetApi, vetErrorHandler } from './domains/vets';

export type { PetsApiResponse, PetError } from './domains/pets';
export type { WeightEntriesApiResponse, WeightError } from './domains/weights';
export type { FoodEntriesApiResponse, FoodError } from './domains/food';
export type { VeterinariansApiResponse, VeterinarianError } from './domains/vets';
