import { getApiUrl } from '@/lib/config';
import type { 
  Pet, 
  PetFormData, 
  PetsApiResponse, 
  PetApiResponse, 
  PetError 
} from '@/types/pet';

// Base API configuration
const API_BASE_URL = getApiUrl();

// Utility function to handle API errors
const handleApiError = (error: unknown): never => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as { response?: { data?: { error?: string } } };
    if (apiError.response?.data?.error) {
      throw new Error(apiError.response.data.error);
    }
  }
  
  if (error instanceof Error) {
    throw new Error(error.message);
  }
  
  throw new Error('An unexpected error occurred');
};

// Utility function to make authenticated requests
const makeAuthenticatedRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for better-auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
};

// Parse JSON response with error handling
const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Pet API functions
export const petApi = {
  // Get all user's pets
  async getPets(): Promise<PetsApiResponse> {
    try {
      const response = await makeAuthenticatedRequest('/api/pets', {
        method: 'GET',
      });

      const result = await parseJsonResponse<{ data: PetsApiResponse; message: string }>(response);
      return result.data;
    } catch (error) {
      console.error('Error fetching pets:', error);
      return handleApiError(error);
    }
  },

  // Get a specific pet by ID
  async getPet(petId: string): Promise<Pet> {
    try {
      const response = await makeAuthenticatedRequest(`/api/pets/${petId}`, {
        method: 'GET',
      });

      const result = await parseJsonResponse<{ data: PetApiResponse; message: string }>(response);
      return result.data.pet;
    } catch (error) {
      console.error('Error fetching pet:', error);
      return handleApiError(error);
    }
  },

  // Create a new pet
  async createPet(petData: PetFormData): Promise<Pet> {
    try {
      const response = await makeAuthenticatedRequest('/api/pets', {
        method: 'POST',
        body: JSON.stringify(petData),
      });

      const result = await parseJsonResponse<{ data: PetApiResponse; message: string }>(response);
      return result.data.pet;
    } catch (error) {
      console.error('Error creating pet:', error);
      return handleApiError(error);
    }
  },

  // Update an existing pet
  async updatePet(petId: string, petData: Partial<PetFormData>): Promise<Pet> {
    try {
      const response = await makeAuthenticatedRequest(`/api/pets/${petId}`, {
        method: 'PUT',
        body: JSON.stringify(petData),
      });

      const result = await parseJsonResponse<{ data: PetApiResponse; message: string }>(response);
      return result.data.pet;
    } catch (error) {
      console.error('Error updating pet:', error);
      return handleApiError(error);
    }
  },

  // Delete a pet (soft delete)
  async deletePet(petId: string): Promise<void> {
    try {
      const response = await makeAuthenticatedRequest(`/api/pets/${petId}`, {
        method: 'DELETE',
      });

      await parseJsonResponse<{ message: string }>(response);
    } catch (error) {
      console.error('Error deleting pet:', error);
      handleApiError(error);
    }
  },

  // Permanently delete a pet (hard delete)
  async permanentlyDeletePet(petId: string): Promise<void> {
    try {
      const response = await makeAuthenticatedRequest(`/api/pets/${petId}/permanent`, {
        method: 'DELETE',
      });

      await parseJsonResponse<{ message: string }>(response);
    } catch (error) {
      console.error('Error permanently deleting pet:', error);
      handleApiError(error);
    }
  },

  // Get pet count
  async getPetCount(): Promise<number> {
    try {
      const response = await makeAuthenticatedRequest('/api/pets/stats/count', {
        method: 'GET',
      });

      const result = await parseJsonResponse<{ data: { count: number }; message: string }>(response);
      return result.data.count;
    } catch (error) {
      console.error('Error fetching pet count:', error);
      return handleApiError(error);
    }
  },
};

// Pet error handler utility (following your authErrorHandler pattern)
export const petErrorHandler = (error: unknown): PetError => {
  let message: string;
  let field: keyof PetFormData | undefined;
  let code: string | undefined;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = 'An error occurred while processing your request';
  }

  // Map specific validation errors to fields
  if (message.includes('name')) {
    field = 'name';
    code = 'INVALID_NAME';
  } else if (message.includes('species') || message.includes('breed')) {
    field = 'species';
    code = 'INVALID_SPECIES';
  } else if (message.includes('weight')) {
    field = 'weight';
    code = 'INVALID_WEIGHT';
  } else if (message.includes('birth') || message.includes('date')) {
    field = 'birthDate';
    code = 'INVALID_DATE';
  } else if (message.includes('microchip')) {
    field = 'microchipNumber';
    code = 'INVALID_MICROCHIP';
  } else if (message.includes('not found')) {
    code = 'PET_NOT_FOUND';
  } else if (message.includes('unauthorized') || message.includes('forbidden')) {
    code = 'UNAUTHORIZED';
  }

  return {
    message,
    field,
    code: code || 'PET_ERROR',
  };
};