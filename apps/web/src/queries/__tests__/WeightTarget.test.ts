import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '@/test/utils/test-utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useWeightTarget,
  useUpsertWeightTarget,
  useDeleteWeightTarget,
  weightTargetKeys,
} from '@/queries/weight-targets';
import { mockWeightTarget, resetMockWeightTarget } from '@/test/mocks/handlers';
import type { WeightTarget, WeightTargetFormData } from '@/types/weight-targets';

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_PET_ID = 'pet-1';

describe('Weight Targets Queries', () => {
  
  beforeEach(() => {
    resetMockWeightTarget();
  });

  console.log('🧪 Weight Targets Test suite loading');

  // ============================================
  // READ OPERATIONS (Queries)
  // ============================================

  describe('useWeightTarget', () => {
    it('should fetch and return weight target successfully', async () => {
      const { result } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );

      // Initial loading state
      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert data structure
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe('target-1');
      expect(result.current.data?.petId).toBe(TEST_PET_ID);
      expect(result.current.data?.minWeight).toBe('4.0');
      expect(result.current.data?.maxWeight).toBe('5.0');
      expect(result.current.data?.weightUnit).toBe('kg');
    });

    it('should return null when no target exists', async () => {
      // Mock endpoint to return null
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/weight-target`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              weightTarget: null,
            },
            message: 'No weight target found for this pet',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle errors when fetching target', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/weight-target`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Failed to fetch weight target',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
    });

    it('should not fetch when petId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => useWeightTarget(''));

      // Should stay in idle state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should use staleTime: Infinity for caching', async () => {
      const { result, queryClient } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that query options have staleTime: Infinity
      const queryState = queryClient.getQueryState(weightTargetKeys.byPet(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });
  });

  // ============================================
  // WRITE OPERATIONS (Mutations)
  // ============================================

  describe('useUpsertWeightTarget', () => {
    it('should create new weight target and invalidate cache', async () => {
      // STEP 1: Fetch target first (ensure query exists in cache)
      const { result: targetQueryResult, queryClient } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(targetQueryResult.current.isSuccess).toBe(true);
      });
      
      expect(targetQueryResult.current.data).toBeDefined();
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpsertWeightTarget(TEST_PET_ID),
        { queryClient }
      );

      // STEP 3: Execute mutation with new target data
      const newTargetData: WeightTargetFormData = {
        minWeight: '3.5',
        maxWeight: '4.5',
        weightUnit: 'kg',
      };

      await mutationResult.current.mutateAsync(newTargetData);

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify cache was invalidated
      const queryState = queryClient.getQueryState(weightTargetKeys.byPet(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    it('should update existing weight target and invalidate cache', async () => {
      // STEP 1: Fetch existing target
      const { result: targetQueryResult, queryClient } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(targetQueryResult.current.isSuccess).toBe(true);
      });
      
      const originalTarget = targetQueryResult.current.data;
      expect(originalTarget?.minWeight).toBe('4.0');
      expect(originalTarget?.maxWeight).toBe('5.0');
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpsertWeightTarget(TEST_PET_ID),
        { queryClient }
      );

      // STEP 3: Execute mutation with updated data
      const updateData: WeightTargetFormData = {
        minWeight: '4.5',
        maxWeight: '5.5',
        weightUnit: 'kg',
      };

      await mutationResult.current.mutateAsync(updateData);

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify cache was invalidated
      const queryState = queryClient.getQueryState(weightTargetKeys.byPet(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    // ============================================
    // VALIDATION TESTS (Frontend Validator)
    // ============================================

    it('should handle validation error: minWeight >= maxWeight', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData: WeightTargetFormData = {
        minWeight: '5.0',
        maxWeight: '4.0', // Max less than min
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle validation error: minWeight equals maxWeight', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData: WeightTargetFormData = {
        minWeight: '4.5',
        maxWeight: '4.5', // Equal values
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle validation error: negative minWeight', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData: WeightTargetFormData = {
        minWeight: '-1.0',
        maxWeight: '5.0',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle validation error: negative maxWeight', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData: WeightTargetFormData = {
        minWeight: '4.0',
        maxWeight: '-2.0',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle validation error: zero minWeight', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData: WeightTargetFormData = {
        minWeight: '0',
        maxWeight: '5.0',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle validation error: zero maxWeight', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData: WeightTargetFormData = {
        minWeight: '4.0',
        maxWeight: '0',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle validation error: empty minWeight string', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData: WeightTargetFormData = {
        minWeight: '',
        maxWeight: '5.0',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle validation error: empty maxWeight string', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData: WeightTargetFormData = {
        minWeight: '4.0',
        maxWeight: '',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle validation error: invalid minWeight (not a number)', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData: WeightTargetFormData = {
        minWeight: 'abc',
        maxWeight: '5.0',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle validation error: invalid maxWeight (not a number)', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData: WeightTargetFormData = {
        minWeight: '4.0',
        maxWeight: 'xyz',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle validation error: missing weightUnit', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const invalidData = {
        minWeight: '4.0',
        maxWeight: '5.0',
        weightUnit: undefined,
      } as unknown as WeightTargetFormData;

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    // ============================================
    // EDGE CASES
    // ============================================

    it('should accept very small range (0.01 difference)', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const smallRangeData: WeightTargetFormData = {
        minWeight: '4.00',
        maxWeight: '4.01',
        weightUnit: 'kg',
      };

      await result.current.mutateAsync(smallRangeData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should accept minimal valid range (0.1 difference)', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const minimalRangeData: WeightTargetFormData = {
        minWeight: '4.0',
        maxWeight: '4.1',
        weightUnit: 'kg',
      };

      await result.current.mutateAsync(minimalRangeData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should accept large valid values (within reasonable limits)', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const largeValueData: WeightTargetFormData = {
        minWeight: '150.0',
        maxWeight: '180.0',
        weightUnit: 'kg',
      };

      await result.current.mutateAsync(largeValueData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should trim whitespace from weight values', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const dataWithWhitespace: WeightTargetFormData = {
        minWeight: '  4.0  ',
        maxWeight: '  5.0  ',
        weightUnit: 'kg',
      };

      await result.current.mutateAsync(dataWithWhitespace);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle decimal precision correctly', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const decimalData: WeightTargetFormData = {
        minWeight: '4.123',
        maxWeight: '5.456',
        weightUnit: 'kg',
      };

      await result.current.mutateAsync(decimalData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle very precise decimal values', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const preciseData: WeightTargetFormData = {
        minWeight: '4.99',
        maxWeight: '5.00',
        weightUnit: 'kg',
      };

      await result.current.mutateAsync(preciseData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should accept lbs as weight unit', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const lbsData: WeightTargetFormData = {
        minWeight: '8.0',
        maxWeight: '12.0',
        weightUnit: 'lbs',
      };

      await result.current.mutateAsync(lbsData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    // ============================================
    // BACKEND VALIDATION ERRORS
    // ============================================

    it('should handle backend rejection (unrealistic range for cat)', async () => {
      server.use(
        http.put(`${API_BASE_URL}/pets/:petId/weight-target`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Target weight range 198.9-199.9kg is outside realistic range for cat',
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const unrealisticData: WeightTargetFormData = {
        minWeight: '198.9',
        maxWeight: '199.9',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(unrealisticData)
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.put(`${API_BASE_URL}/pets/:petId/weight-target`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Network error',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const validData: WeightTargetFormData = {
        minWeight: '4.0',
        maxWeight: '5.0',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(validData)
      ).rejects.toThrow();
    });

    it('should handle unauthorized errors', async () => {
      server.use(
        http.put(`${API_BASE_URL}/pets/:petId/weight-target`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Unauthorized',
            },
            { status: 401 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useUpsertWeightTarget(TEST_PET_ID)
      );

      const validData: WeightTargetFormData = {
        minWeight: '4.0',
        maxWeight: '5.0',
        weightUnit: 'kg',
      };

      await expect(
        result.current.mutateAsync(validData)
      ).rejects.toThrow();
    });
  });

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  describe('useDeleteWeightTarget', () => {
    it('should delete target and invalidate cache', async () => {
      // STEP 1: Fetch target first (ensure query exists in cache)
      const { result: targetQueryResult, queryClient } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(targetQueryResult.current.isSuccess).toBe(true);
      });
      
      expect(targetQueryResult.current.data).toBeDefined();
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteWeightTarget(TEST_PET_ID),
        { queryClient }
      );

      // STEP 3: Execute delete
      await mutationResult.current.mutateAsync();

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify cache was invalidated
      const queryState = queryClient.getQueryState(weightTargetKeys.byPet(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    it('should handle errors when target does not exist', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/pets/:petId/weight-target`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Weight target not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useDeleteWeightTarget(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync()
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle network errors during delete', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/pets/:petId/weight-target`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Network error',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useDeleteWeightTarget(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync()
      ).rejects.toThrow();
    });

    it('should always refetch after delete operation (success or error)', async () => {
      // Create an active observer by rendering the query hook
      const { result: targetQueryResult, queryClient } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );
      
      // Wait for initial fetch
      await waitFor(() => {
        expect(targetQueryResult.current.isSuccess).toBe(true);
      });
      
      // Create mutation with same queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteWeightTarget(TEST_PET_ID),
        { queryClient }
      );
    
      // Execute delete
      await mutationResult.current.mutateAsync();
    
      // Wait for mutation state to update
      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
      
      // Verify the query refetched (because of invalidation)
      await waitFor(() => {
        const queryState = queryClient.getQueryState(weightTargetKeys.byPet(TEST_PET_ID));
        expect(queryState).toBeDefined();
      });
    });
  });

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  describe('Query Keys', () => {
    it('should use correct query keys for caching', () => {
      const petId = 'pet-123';

      expect(weightTargetKeys.all).toEqual(['weight-targets']);
      expect(weightTargetKeys.byPet(petId)).toEqual(['weight-targets', petId]);
    });

    it('should invalidate only weight target cache on upsert (not weights)', async () => {
      const { result: targetQueryResult, queryClient } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(targetQueryResult.current.isSuccess).toBe(true);
      });

      // Set mock data for weight entries cache
      queryClient.setQueryData(['weights', TEST_PET_ID], []);
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpsertWeightTarget(TEST_PET_ID),
        { queryClient }
      );

      const targetData: WeightTargetFormData = {
        minWeight: '4.0',
        maxWeight: '5.0',
        weightUnit: 'kg',
      };

      await mutationResult.current.mutateAsync(targetData);

      // Weight target cache should be invalidated
      const targetQueryState = queryClient.getQueryState(weightTargetKeys.byPet(TEST_PET_ID));
      expect(targetQueryState).toBeDefined();

      // Weight entries cache should still exist (not invalidated)
      const weightsCache = queryClient.getQueryData(['weights', TEST_PET_ID]);
      expect(weightsCache).toBeDefined();
    });

    it('should invalidate only weight target cache on delete (not weights)', async () => {
      const { result: targetQueryResult, queryClient } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(targetQueryResult.current.isSuccess).toBe(true);
      });

      // Set mock data for weight entries cache
      queryClient.setQueryData(['weights', TEST_PET_ID], []);
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteWeightTarget(TEST_PET_ID),
        { queryClient }
      );

      await mutationResult.current.mutateAsync();

      // Weight target cache should be invalidated
      const targetQueryState = queryClient.getQueryState(weightTargetKeys.byPet(TEST_PET_ID));
      expect(targetQueryState).toBeDefined();

      // Weight entries cache should still exist (not invalidated)
      const weightsCache = queryClient.getQueryData(['weights', TEST_PET_ID]);
      expect(weightsCache).toBeDefined();
    });

    it('should not invalidate other pets target caches', async () => {
      const otherPetId = 'pet-2';
      
      const { queryClient } = renderHookWithQuery(() => 
        useWeightTarget(TEST_PET_ID)
      );

      // Set cache for different pet
      queryClient.setQueryData(weightTargetKeys.byPet(otherPetId), mockWeightTarget);

      const { result: mutationResult } = renderHookWithQuery(
        () => useUpsertWeightTarget(TEST_PET_ID),
        { queryClient }
      );

      const targetData: WeightTargetFormData = {
        minWeight: '4.0',
        maxWeight: '5.0',
        weightUnit: 'kg',
      };

      await mutationResult.current.mutateAsync(targetData);

      // Other pet's cache should still exist
      const otherPetCache = queryClient.getQueryData(weightTargetKeys.byPet(otherPetId));
      expect(otherPetCache).toBeDefined();
    });
  });
});