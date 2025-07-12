export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type RequestBody = 
  | string 
  | number 
  | boolean 
  | Record<string, unknown>
  | FormData 
  | URLSearchParams 
  | null 
  | undefined;

export interface ApiRequestConfig extends Omit<RequestInit, 'method' | 'body'> {
  method?: HttpMethod;
  body?: RequestBody;
  params?: Record<string, string | number>;
  timeout?: number;
}

export interface ApiClientResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiErrorContext {
  url: string;
  method: HttpMethod;
  status?: number;
  requestBody?: RequestBody;
  responseBody?: string | ApiSuccessResponse<unknown> | ApiErrorResponse;
}

export type ExtractApiData<T> = T extends ApiSuccessResponse<infer U> ? U : never;