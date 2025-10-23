/**
 * Pets Queries Test Suite
 * 
 * Tests all React Query hooks in src/queries/pets.ts
 * 
 * What we're testing:
 * 1. Data fetching and transformations
 * 2. Query key invalidation (cache management)
 * 3. Optimistic updates and rollbacks
 * 4. Error handling
 * 5. Loading states
 * 
 * Pattern applies to: weights, food, session queries
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '@/test/utils/test-utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  usePets,
  usePet,
  usePetCount,
  useCreatePet,
  useUpdatePet,
  useDeletePet,
  usePetFromCache,
} from '@/queries/pets';
import { mockPets } from '@/test/mocks/handlers';
import type { Pet, PetFormData } from '@/types/pet';

const API_BASE_URL = 'http://localhost:3001/api';

describe('Pets Queries', () => {
  console.log('🧪 Test suite loading');

  // ============================================
  // READ OPERATIONS (Queries)
  // ============================================

  describe('usePets', () => {
    console.log('🧪 usePets describe block');

    it('should fetch and return all pets', async () => {
      console.log('🧪 Test starting');

      const { result } = renderHookWithQuery(() => usePets());

      // Initial loading state
      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert data matches mock
      expect(result.current.data).toEqual(mockPets);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].name).toBe('Fluffy');
    });

    it('should handle empty pets list', async () => {
      // Override default handler for this test
      server.use(
        http.get(`${API_BASE_URL}/pets`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              pets: [],
              total: 0,
            },
            message: 'Retrieved 0 pet(s)',
          });
        })
      );

      const { result } = renderHookWithQuery(() => usePets());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle API errors', async () => {
      // Simulate network error
      server.use(
        http.get(`${API_BASE_URL}/pets`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Internal server error',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => usePets());

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle network timeout', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets`, async () => {
          // Simulate timeout
          await new Promise((resolve) => setTimeout(resolve, 15000));
          return HttpResponse.json({ success: true, data: { pets: [] } });
        })
      );

      const { result } = renderHookWithQuery(() => usePets());

      // Should eventually timeout (based on queryClient config)
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 12000 }
      );
    });
  });

  describe('usePet', () => {
    it('should fetch single pet by ID', async () => {
      const petId = 'pet-1';
      const { result } = renderHookWithQuery(() => usePet(petId));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.id).toBe(petId);
      expect(result.current.data?.name).toBe('Fluffy');
    });

    it('should handle pet not found', async () => {
      const nonExistentId = 'pet-999';
      
      server.use(
        http.get(`${API_BASE_URL}/pets/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Pet not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => usePet(nonExistentId));

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should not fetch when petId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => usePet(''));

      // Should stay in idle state
      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('usePetCount', () => {
    it('should fetch pet count', async () => {
      const { result } = renderHookWithQuery(() => usePetCount());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(2);
    });
  });

  // ============================================
  // WRITE OPERATIONS (Mutations)
  // ============================================

  describe('useCreatePet', () => {
    it('should create new pet and invalidate pets list', async () => {
      const { result, queryClient } = renderHookWithQuery(() => useCreatePet());

      const newPetData: PetFormData = {
        name: 'Buddy',
        animalType: 'dog',
        species: 'Labrador',
        gender: 'male',
        birthDate: '2020-01-01',
        weight: '25.5',
        weightUnit: 'kg',
        isNeutered: false,
        microchipNumber: '',
        notes: '',
      };

      // Execute mutation
      let createdPet: Pet | undefined;
      await waitFor(async () => {
        createdPet = await result.current.mutateAsync(newPetData);
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert pet was created with correct data
      expect(createdPet).toBeDefined();
      expect(createdPet?.name).toBe('Buddy');
      expect(createdPet?.animalType).toBe('dog');

      // CRITICAL: Verify cache invalidation
      // The pets list query should be invalidated
      const petsQueryState = queryClient.getQueryState(['pets']);
      expect(petsQueryState?.isInvalidated).toBe(true);
    });

    it('should handle weight with comma (transform to dot)', async () => {
      const { result } = renderHookWithQuery(() => useCreatePet());

      const petData: PetFormData = {
        name: 'Test Pet',
        animalType: 'cat',
        species: '',
        gender: 'unknown',
        birthDate: '',
        weight: '4,5',
        weightUnit: 'kg',
        isNeutered: false,
        microchipNumber: '',
        notes: '',
      };

      let createdPet: Pet | undefined;
      await waitFor(async () => {
        createdPet = await result.current.mutateAsync(petData);
      });

      // Weight should be transformed to dot notation
      expect(createdPet?.weight).toBe('4.5');
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/pets`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Pet name is required',
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useCreatePet());

      const invalidData: PetFormData = {
        name: '',
        animalType: 'cat',
        species: '',
        gender: 'unknown',
        birthDate: '',
        weight: '',
        weightUnit: 'kg',
        isNeutered: false,
        microchipNumber: '',
        notes: '',
      };

      // Should fail
      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdatePet', () => {
    it('should update pet and invalidate both list and detail caches', async () => {
      const { result, queryClient } = renderHookWithQuery(() => useUpdatePet());

      const petId = 'pet-1';
      const updateData: Partial<PetFormData> = {
        name: 'Fluffy Updated',
        weight: '5.0',
      };

      // Pre-populate cache with pet data (simulate previous fetch)
      queryClient.setQueryData(['pets'], mockPets);
      queryClient.setQueryData(['pets', petId], mockPets[0]);

      // Execute mutation
      await waitFor(async () => {
        await result.current.mutateAsync({ petId, petData: updateData });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // CRITICAL: Verify both caches are invalidated
      const listQueryState = queryClient.getQueryState(['pets']);
      const detailQueryState = queryClient.getQueryState(['pets', petId]);

      expect(listQueryState?.isInvalidated).toBe(true);
      expect(detailQueryState?.isInvalidated).toBe(true);
    });

    it('should handle update errors', async () => {
      server.use(
        http.put(`${API_BASE_URL}/pets/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Pet not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useUpdatePet());

      await expect(
        result.current.mutateAsync({
          petId: 'non-existent',
          petData: { name: 'Test' },
        })
      ).rejects.toThrow();
    });
  });

  describe('useDeletePet', () => {
    it('should optimistically remove pet from cache', async () => {
      const { result, queryClient } = renderHookWithQuery(() => useDeletePet());

      // Pre-populate cache
      queryClient.setQueryData(['pets'], mockPets);

      const petIdToDelete = 'pet-1';

      // Execute mutation
      result.current.mutate(petIdToDelete);

      // IMMEDIATELY check optimistic update (before API response)
      await waitFor(() => {
        const cachedPets = queryClient.getQueryData<Pet[]>(['pets']);
        expect(cachedPets?.find((p) => p.id === petIdToDelete)).toBeUndefined();
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should rollback on error', async () => {
      // Simulate API error
      server.use(
        http.delete(`${API_BASE_URL}/pets/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Failed to delete pet',
            },
            { status: 500 }
          );
        })
      );

      const { result, queryClient } = renderHookWithQuery(() => useDeletePet());

      // Pre-populate cache
      const originalPets = [...mockPets];
      queryClient.setQueryData(['pets'], originalPets);

      const petIdToDelete = 'pet-1';

      // Execute mutation (will fail)
      result.current.mutate(petIdToDelete);

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // CRITICAL: Cache should be rolled back to original state
      const cachedPets = queryClient.getQueryData<Pet[]>(['pets']);
      expect(cachedPets).toEqual(originalPets);
      expect(cachedPets?.find((p) => p.id === petIdToDelete)).toBeDefined();
    });

    it('should always refetch after operation (success or error)', async () => {
      const { result, queryClient } = renderHookWithQuery(() => useDeletePet());

      queryClient.setQueryData(['pets'], mockPets);

      result.current.mutate('pet-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Query should be invalidated and refetched
      const queryState = queryClient.getQueryState(['pets']);
      expect(queryState?.isInvalidated).toBe(true);
    });
  });

  // ============================================
  // CACHE HELPERS
  // ============================================

  describe('usePetFromCache', () => {
    it('should retrieve pet from cache without API call', () => {
      const { result, queryClient } = renderHookWithQuery(() =>
        usePetFromCache('pet-1')
      );

      // Cache is empty initially
      expect(result.current).toBeUndefined();

      // Populate cache
      queryClient.setQueryData(['pets'], mockPets);

      // Re-render to get updated value
      const { result: result2 } = renderHookWithQuery(() =>
        usePetFromCache('pet-1')
      );

      // Should return cached pet
      expect(result2.current?.id).toBe('pet-1');
      expect(result2.current?.name).toBe('Fluffy');
    });

    it('should return undefined for non-existent pet', () => {
      const { result, queryClient } = renderHookWithQuery(() =>
        usePetFromCache('pet-999')
      );

      queryClient.setQueryData(['pets'], mockPets);

      expect(result.current).toBeUndefined();
    });
  });
});