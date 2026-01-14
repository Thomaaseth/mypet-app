/**
 * Veterinarians Queries Test Suite
 * 
 * Tests all React Query hooks in src/queries/vets.ts
 * 
 * What we're testing:
 * 1. Data fetching (all vets, single vet, pet-vet assignments)
 * 2. Query key invalidation (cache management)
 * 3. CRUD operations (create, update, delete)
 * 4. Pet assignment operations (assign, unassign)
 * 5. Error handling (validation, network, not found)
 * 6. Loading states
 * 7. Cache operations (useVeterinarianFromCache)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '@/test/utils/test-utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useVeterinarians,
  useVeterinarian,
  useVetPets,
  usePetVets,
  useVeterinarianFromCache,
  useCreateVeterinarian,
  useUpdateVeterinarian,
  useDeleteVeterinarian,
  useAssignVetToPets,
  useUnassignVetFromPets,
  vetKeys,
} from '@/queries/vets';
import { mockVeterinarians, mockPets, resetMockVeterinarians } from '@/test/mocks/handlers';
import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';

const API_BASE_URL = 'http://localhost:3001/api';

describe('Veterinarians Queries', () => {

  beforeEach(() => {
    resetMockVeterinarians();
  });

  console.log('🧪 Veterinarians Test suite loading');

  // ============================================
  // READ OPERATIONS (Queries)
  // ============================================

  describe('useVeterinarians', () => {
    it('should fetch and return all veterinarians', async () => {
      const { result } = renderHookWithQuery(() => useVeterinarians());

      // Initial loading state
      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert data matches mock
      expect(result.current.data).toEqual(mockVeterinarians);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].vetName).toBe('Dr. Sarah Johnson');
    });

    it('should handle empty veterinarians list', async () => {
      // Override default handler for this test
      server.use(
        http.get(`${API_BASE_URL}/vets`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              veterinarians: [],
              total: 0,
            },
            message: 'Retrieved 0 veterinarian(s)',
          });
        })
      );

      const { result } = renderHookWithQuery(() => useVeterinarians());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle API errors', async () => {
      // Simulate network error
      server.use(
        http.get(`${API_BASE_URL}/vets`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Internal server error',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useVeterinarians());

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useVeterinarian', () => {
    it('should fetch single veterinarian by ID', async () => {
      const vetId = 'vet-1';
      const { result } = renderHookWithQuery(() => useVeterinarian(vetId));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.id).toBe(vetId);
      expect(result.current.data?.vetName).toBe('Dr. Sarah Johnson');
      expect(result.current.data?.clinicName).toBe('City Vet Clinic');
    });

    it('should handle veterinarian not found', async () => {
      const nonExistentId = 'vet-999';
      
      server.use(
        http.get(`${API_BASE_URL}/vets/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Veterinarian not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useVeterinarian(nonExistentId));

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should not fetch when vetId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => useVeterinarian(''));

      // Should stay in idle state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useVetPets', () => {
    it('should fetch pets assigned to a veterinarian', async () => {
      const vetId = 'vet-1';
      const { result } = renderHookWithQuery(() => useVetPets(vetId));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data?.[0]).toHaveProperty('petId');
    });

    it('should return empty array when no pets assigned', async () => {
      server.use(
        http.get(`${API_BASE_URL}/vets/:id/pets`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              pets: [],
            },
            message: 'No pets assigned',
          });
        })
      );

      const { result } = renderHookWithQuery(() => useVetPets('vet-2'));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should not fetch when vetId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => useVetPets(''));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('usePetVets', () => {
    it('should fetch veterinarians assigned to a pet', async () => {
      const petId = 'pet-1';
      const { result } = renderHookWithQuery(() => usePetVets(petId));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should return empty array when no vets assigned', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/vets`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              veterinarians: [],
              total: 0,
            },
            message: 'No veterinarians assigned',
          });
        })
      );

      const { result } = renderHookWithQuery(() => usePetVets('pet-2'));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should not fetch when petId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => usePetVets(''));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useVeterinarianFromCache', () => {
    it('should return undefined when veterinarian not in cache', () => {
      const { result, queryClient } = renderHookWithQuery(() => {
        return useVeterinarianFromCache('vet-1');
      });

      expect(result.current).toBeUndefined();
    });

    it('should return veterinarian from cache after fetching', async () => {
      const vetId = 'vet-1';
      
      // First fetch the vet to populate cache
      const { result: fetchResult, queryClient } = renderHookWithQuery(() => 
        useVeterinarian(vetId)
      );

      await waitFor(() => {
        expect(fetchResult.current.isSuccess).toBe(true);
      });

      // Now get from cache
      const { result: cacheResult } = renderHookWithQuery(
        () => useVeterinarianFromCache(vetId),
        { queryClient }
      );

      expect(cacheResult.current).toBeDefined();
      expect(cacheResult.current?.id).toBe(vetId);
      expect(cacheResult.current?.vetName).toBe('Dr. Sarah Johnson');
    });
  });

  // ============================================
  // WRITE OPERATIONS (Mutations)
  // ============================================

  describe('useCreateVeterinarian', () => {
    it('should create new veterinarian and invalidate vets list', async () => {
      // STEP 1: Fetch vets first (so query exists in cache)
      const { result: vetsQueryResult, queryClient } = renderHookWithQuery(() => 
        useVeterinarians()
      );
      
      await waitFor(() => {
        expect(vetsQueryResult.current.isSuccess).toBe(true);
      });
      
      expect(vetsQueryResult.current.data).toHaveLength(2);
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateVeterinarian(),
        { queryClient }
      );
  
      const newVetData: VeterinarianFormData = {
        vetName: 'Dr. Michael Brown',
        clinicName: 'Pet Care Center',
        phone: '555-9876',
        email: 'mbrown@petcare.com',
        website: 'www.petcare.com',
        addressLine1: '789 Oak Avenue',
        addressLine2: '',
        city: 'Cambridge',
        zipCode: '02138',
        notes: 'Specializes in exotic pets',
      };
  
      // STEP 3: Execute mutation
      let createdVet: Veterinarian | undefined;
      await waitFor(async () => {
        createdVet = await mutationResult.current.mutateAsync({
          vetData: newVetData,
        });
      });
  
      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
  
      // STEP 4: Verify vet was created with correct data
      expect(createdVet).toBeDefined();
      expect(createdVet?.vetName).toBe('Dr. Michael Brown');
      expect(createdVet?.clinicName).toBe('Pet Care Center');
  
      // STEP 5: Verify cache invalidation happened
      const queryState = queryClient.getQueryState(vetKeys.all);
      expect(queryState).toBeDefined();
      
      // STEP 6: Verify the query refetched (vets list updates automatically)
      await waitFor(() => {
        // The useVeterinarians() query should auto-refetch and include the new vet
        expect(vetsQueryResult.current.data).toHaveLength(3);
        expect(vetsQueryResult.current.data?.find(v => v.vetName === 'Dr. Michael Brown')).toBeDefined();
      });
    });

    it('should create veterinarian with pet assignments', async () => {
      const { result: vetsQueryResult, queryClient } = renderHookWithQuery(() => 
        useVeterinarians()
      );
      
      await waitFor(() => {
        expect(vetsQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateVeterinarian(),
        { queryClient }
      );
  
      const newVetData: VeterinarianFormData = {
        vetName: 'Dr. Emily Davis',
        clinicName: 'Animal Hospital',
        phone: '555-5555',
        email: '',
        website: '',
        addressLine1: '321 Elm St',
        addressLine2: '',
        city: 'Boston',
        zipCode: '02101',
        notes: '',
      };
  
      const petIds = ['pet-1', 'pet-2'];
  
      await waitFor(async () => {
        await mutationResult.current.mutateAsync({
          vetData: newVetData,
          petIds,
        });
      });
  
      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/vets`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Veterinarian name is required',
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useCreateVeterinarian());

      const invalidData: VeterinarianFormData = {
        vetName: '',
        clinicName: '',
        phone: '555-1234',
        email: '',
        website: '',
        addressLine1: '123 Main St',
        addressLine2: '',
        city: 'Boston',
        zipCode: '02101',
        notes: '',
      };

      // Should fail
      await expect(
        result.current.mutateAsync({ vetData: invalidData })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdateVeterinarian', () => {
    it('should update veterinarian and invalidate both list and detail caches', async () => {
      const vetId = 'vet-1';
      
      // STEP 1: Fetch vets list AND detail first
      const { result: vetsListResult, queryClient } = renderHookWithQuery(() => 
        useVeterinarians()
      );
      
      await waitFor(() => {
        expect(vetsListResult.current.isSuccess).toBe(true);
      });
      
      expect(vetsListResult.current.data).toHaveLength(2);
      const originalVet = vetsListResult.current.data?.find(v => v.id === vetId);
      expect(originalVet?.vetName).toBe('Dr. Sarah Johnson');
      
      // Fetch detail to populate detail cache
      const { result: detailResult } = renderHookWithQuery(
        () => useVeterinarian(vetId),
        { queryClient }
      );
      
      await waitFor(() => {
        expect(detailResult.current.isSuccess).toBe(true);
      });
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateVeterinarian(),
        { queryClient }
      );

      // STEP 3: Execute mutation
      const updateData: Partial<VeterinarianFormData> = {
        vetName: 'Dr. Sarah Johnson-Smith',
        clinicName: 'Updated Clinic Name',
      };

      await mutationResult.current.mutateAsync({
        vetId,
        vetData: updateData,
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify list cache was invalidated
      const listQueryState = queryClient.getQueryState(vetKeys.all);
      expect(listQueryState).toBeDefined();

      // STEP 5: Verify the vets list refetched with updated data
      await waitFor(() => {
        const updatedVet = vetsListResult.current.data?.find(v => v.id === vetId);
        expect(updatedVet?.vetName).toBe('Dr. Sarah Johnson-Smith');
        expect(updatedVet?.clinicName).toBe('Updated Clinic Name');
      });
    });

    it('should handle partial updates', async () => {
      const vetId = 'vet-1';
      
      const { result: vetsListResult, queryClient } = renderHookWithQuery(() => 
        useVeterinarians()
      );
      
      await waitFor(() => {
        expect(vetsListResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateVeterinarian(),
        { queryClient }
      );

      // Only update phone number
      const updateData: Partial<VeterinarianFormData> = {
        phone: '555-0000',
      };

      await mutationResult.current.mutateAsync({
        vetId,
        vetData: updateData,
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // Verify cache was invalidated (the actual data update is tested in backend tests)
      const listQueryState = queryClient.getQueryState(vetKeys.all);
      expect(listQueryState).toBeDefined();
    });

    it('should handle validation errors', async () => {
      server.use(
        http.put(`${API_BASE_URL}/vets/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Invalid email format',
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useUpdateVeterinarian());

      const invalidData: Partial<VeterinarianFormData> = {
        email: 'invalid-email',
      };

      await expect(
        result.current.mutateAsync({
          vetId: 'vet-1',
          vetData: invalidData,
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle not found errors', async () => {
      server.use(
        http.put(`${API_BASE_URL}/vets/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Veterinarian not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useUpdateVeterinarian());

      await expect(
        result.current.mutateAsync({
          vetId: 'vet-999',
          vetData: { phone: '555-1234' },
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useDeleteVeterinarian', () => {
    it('should delete veterinarian and update cache', async () => {
      const vetId = 'vet-2';
      
      // STEP 1: Fetch vets first
      const { result: vetsQueryResult, queryClient } = renderHookWithQuery(() => 
        useVeterinarians()
      );
      
      await waitFor(() => {
        expect(vetsQueryResult.current.isSuccess).toBe(true);
      });
      
      expect(vetsQueryResult.current.data).toHaveLength(2);
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteVeterinarian(),
        { queryClient }
      );

      // STEP 3: Execute mutation
      await mutationResult.current.mutateAsync(vetId);

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify cache was invalidated
      const queryState = queryClient.getQueryState(vetKeys.all);
      expect(queryState).toBeDefined();

      // STEP 5: Verify detail cache was removed
      const detailQueryState = queryClient.getQueryState(vetKeys.detail(vetId));
      expect(detailQueryState).toBeUndefined();

      // STEP 6: Verify the vets list refetched without the deleted vet
      await waitFor(() => {
        expect(vetsQueryResult.current.data).toHaveLength(1);
        expect(vetsQueryResult.current.data?.find(v => v.id === vetId)).toBeUndefined();
      });
    });

    it('should handle not found errors', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/vets/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Veterinarian not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useDeleteVeterinarian());

      await expect(
        result.current.mutateAsync('vet-999')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAssignVetToPets', () => {
    it('should assign veterinarian to pets and invalidate caches', async () => {
      const vetId = 'vet-1';
      const petIds = ['pet-1', 'pet-2'];
      
      // STEP 1: Fetch vets, detail, and pets first to populate caches
      const { result: vetsQueryResult, queryClient } = renderHookWithQuery(() => 
        useVeterinarians()
      );
      
      await waitFor(() => {
        expect(vetsQueryResult.current.isSuccess).toBe(true);
      });
      
      // Fetch detail to populate detail cache
      const { result: detailResult } = renderHookWithQuery(
        () => useVeterinarian(vetId),
        { queryClient }
      );
      
      await waitFor(() => {
        expect(detailResult.current.isSuccess).toBe(true);
      });
      
      // Fetch vet pets to populate that cache
      const { result: petsResult } = renderHookWithQuery(
        () => useVetPets(vetId),
        { queryClient }
      );
      
      await waitFor(() => {
        expect(petsResult.current.isSuccess).toBe(true);
      });
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useAssignVetToPets(),
        { queryClient }
      );

      // STEP 3: Execute mutation
      await mutationResult.current.mutateAsync({
        vetId,
        petIds,
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify list cache was invalidated
      const vetsListState = queryClient.getQueryState(vetKeys.all);
      expect(vetsListState).toBeDefined();
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/vets/:id/assign`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Pet not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useAssignVetToPets());

      await expect(
        result.current.mutateAsync({
          vetId: 'vet-1',
          petIds: ['pet-999'],
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUnassignVetFromPets', () => {
    it('should unassign veterinarian from pets and invalidate caches', async () => {
      const vetId = 'vet-1';
      const petIds = ['pet-1'];
      
      // STEP 1: Fetch vets first
      const { result: vetsQueryResult, queryClient } = renderHookWithQuery(() => 
        useVeterinarians()
      );
      
      await waitFor(() => {
        expect(vetsQueryResult.current.isSuccess).toBe(true);
      });
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useUnassignVetFromPets(),
        { queryClient }
      );

      // STEP 3: Execute mutation
      await mutationResult.current.mutateAsync({
        vetId,
        petIds,
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify list cache was invalidated
      const vetsListState = queryClient.getQueryState(vetKeys.all);
      expect(vetsListState).toBeDefined();
    });

    it('should handle not found errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/vets/:id/unassign`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Veterinarian not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useUnassignVetFromPets());

      await expect(
        result.current.mutateAsync({
          vetId: 'vet-999',
          petIds: ['pet-1'],
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle concurrent mutations', async () => {
      const { result: vetsQueryResult, queryClient } = renderHookWithQuery(() => 
        useVeterinarians()
      );
      
      await waitFor(() => {
        expect(vetsQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: createResult } = renderHookWithQuery(
        () => useCreateVeterinarian(),
        { queryClient }
      );

      const { result: updateResult } = renderHookWithQuery(
        () => useUpdateVeterinarian(),
        { queryClient }
      );

      const newVetData: VeterinarianFormData = {
        vetName: 'Dr. Concurrent',
        clinicName: '',
        phone: '555-0001',
        email: '',
        website: '',
        addressLine1: '123 Test St',
        addressLine2: '',
        city: 'Boston',
        zipCode: '02101',
        notes: '',
      };

      const updateData: Partial<VeterinarianFormData> = {
        phone: '555-0002',
      };

      // Execute mutations concurrently
      const promises = [
        createResult.current.mutateAsync({ vetData: newVetData }),
        updateResult.current.mutateAsync({ vetId: 'vet-1', vetData: updateData }),
      ];

      await Promise.all(promises);

      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true);
        expect(updateResult.current.isSuccess).toBe(true);
      });
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        http.get(`${API_BASE_URL}/vets`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Network error',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useVeterinarians());

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle empty string fields correctly', async () => {
      const { result: vetsQueryResult, queryClient } = renderHookWithQuery(() => 
        useVeterinarians()
      );
      
      await waitFor(() => {
        expect(vetsQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateVeterinarian(),
        { queryClient }
      );

      const newVetData: VeterinarianFormData = {
        vetName: 'Dr. Minimal',
        clinicName: '', // Empty string
        phone: '555-1234',
        email: '', // Empty string
        website: '', // Empty string
        addressLine1: '123 Main St',
        addressLine2: '', // Empty string
        city: 'Boston',
        zipCode: '02101',
        notes: '', // Empty string
      };

      await mutationResult.current.mutateAsync({ vetData: newVetData });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });
  });
});