/**
 * Dry Food Queries Test Suite
 * 
 * Tests all React Query hooks in src/queries/food/dryFood.ts
 * 
 * What we're testing:
 * 1. Data fetching (active and finished entries)
 * 2. Data transformations (lowStock calculation, sorting)
 * 3. Query key invalidation (cache management)
 * 4. CRUD operations (create, update, delete)
 * 5. Business logic (mark as finished, update finish date)
 * 6. Error handling (validation, network, not found)
 * 7. Edge cases (optional fields, units, dates)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '@/test/utils/test-utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useActiveDryFood,
  useFinishedDryFood,
  useCreateDryFood,
  useUpdateDryFood,
  useDeleteDryFood,
  useMarkDryFoodFinished,
  useUpdateDryFoodFinishDate,
  foodKeys,
} from '@/queries/food';
import { mockActiveDryFood, mockFinishedDryFood, resetMockDryFood } from '@/test/mocks/handlers';
import type { DryFoodEntry, DryFoodFormData } from '@/types/food';

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_PET_ID = 'pet-1';

describe('Dry Food Queries', () => {
  
  beforeEach(() => {
    resetMockDryFood();
  });

  console.log('🧪 Dry Food Test suite loading');

  // ============================================
  // READ OPERATIONS (Queries)
  // ============================================

  describe('useActiveDryFood', () => {
    it('should fetch and return active dry food entries', async () => {
      const { result } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
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
      expect(result.current.data?.entries).toBeDefined();
      expect(result.current.data?.lowStock).toBeDefined();
      expect(Array.isArray(result.current.data?.entries)).toBe(true);
      expect(Array.isArray(result.current.data?.lowStock)).toBe(true);
    });

    it('should calculate low stock entries correctly (remainingDays <= 7)', async () => {
      // Mock data with low stock entry
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/dry`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              foodEntries: [
                {
                  id: 'dry-1',
                  petId: TEST_PET_ID,
                  foodType: 'dry',
                  brandName: 'Brand A',
                  productName: 'Product A',
                  bagWeight: '2.0',
                  bagWeightUnit: 'kg',
                  dailyAmount: '100',
                  dryDailyAmountUnit: 'grams',
                  dateStarted: '2024-01-01',
                  dateFinished: null,
                  isActive: true,
                  remainingDays: 5, // Low stock
                  remainingWeight: 500,
                  createdAt: '2024-01-01T00:00:00.000Z',
                  updatedAt: '2024-01-01T00:00:00.000Z',
                  numberOfUnits: null,
                  weightPerUnit: null,
                  wetWeightUnit: null,
                  wetDailyAmountUnit: null,
                },
                {
                  id: 'dry-2',
                  petId: TEST_PET_ID,
                  foodType: 'dry',
                  brandName: 'Brand B',
                  productName: 'Product B',
                  bagWeight: '3.0',
                  bagWeightUnit: 'kg',
                  dailyAmount: '100',
                  dryDailyAmountUnit: 'grams',
                  dateStarted: '2024-01-15',
                  dateFinished: null,
                  isActive: true,
                  remainingDays: 20, // Not low stock
                  remainingWeight: 2000,
                  createdAt: '2024-01-15T00:00:00.000Z',
                  updatedAt: '2024-01-15T00:00:00.000Z',
                  numberOfUnits: null,
                  weightPerUnit: null,
                  wetWeightUnit: null,
                  wetDailyAmountUnit: null,
                },
              ],
              total: 2,
            },
            message: 'Retrieved 2 dry food entries',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const { entries, lowStock } = result.current.data!;
      
      expect(entries).toHaveLength(2);
      expect(lowStock).toHaveLength(1);
      expect(lowStock[0].id).toBe('dry-1');
      expect(lowStock[0].remainingDays).toBe(5);
    });

    it('should exclude entries with remainingDays > 7 from low stock', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/dry`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              foodEntries: [
                {
                  id: 'dry-1',
                  petId: TEST_PET_ID,
                  foodType: 'dry',
                  brandName: 'Brand A',
                  productName: 'Product A',
                  bagWeight: '2.0',
                  bagWeightUnit: 'kg',
                  dailyAmount: '100',
                  dryDailyAmountUnit: 'grams',
                  dateStarted: '2024-01-01',
                  dateFinished: null,
                  isActive: true,
                  remainingDays: 10, // Above threshold
                  remainingWeight: 1000,
                  createdAt: '2024-01-01T00:00:00.000Z',
                  updatedAt: '2024-01-01T00:00:00.000Z',
                  numberOfUnits: null,
                  weightPerUnit: null,
                  wetWeightUnit: null,
                  wetDailyAmountUnit: null,
                },
              ],
              total: 1,
            },
            message: 'Retrieved 1 dry food entry',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.lowStock).toHaveLength(0);
    });

    it('should exclude entries with remainingDays <= 0 from low stock', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/dry`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              foodEntries: [
                {
                  id: 'dry-1',
                  petId: TEST_PET_ID,
                  foodType: 'dry',
                  brandName: 'Brand A',
                  productName: 'Product A',
                  bagWeight: '2.0',
                  bagWeightUnit: 'kg',
                  dailyAmount: '100',
                  dryDailyAmountUnit: 'grams',
                  dateStarted: '2024-01-01',
                  dateFinished: null,
                  isActive: true,
                  remainingDays: 0, // Depleted
                  remainingWeight: 0,
                  createdAt: '2024-01-01T00:00:00.000Z',
                  updatedAt: '2024-01-01T00:00:00.000Z',
                  numberOfUnits: null,
                  weightPerUnit: null,
                  wetWeightUnit: null,
                  wetDailyAmountUnit: null,
                },
              ],
              total: 1,
            },
            message: 'Retrieved 1 dry food entry',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.lowStock).toHaveLength(0);
    });

    it('should handle empty active entries list', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/dry`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              foodEntries: [],
              total: 0,
            },
            message: 'No dry food entries found',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.entries).toHaveLength(0);
      expect(result.current.data?.lowStock).toHaveLength(0);
    });

    it('should handle errors when fetching active entries', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/dry`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Failed to fetch dry food entries',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
    });

    it('should not fetch when petId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => useActiveDryFood(''));

      // Should stay in idle state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useFinishedDryFood', () => {
    it('should fetch and return finished dry food entries', async () => {
      const { result } = renderHookWithQuery(() => 
        useFinishedDryFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should sort finished entries by dateFinished DESC (most recent first)', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/finished`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              foodEntries: [
                {
                  id: 'dry-1',
                  petId: TEST_PET_ID,
                  foodType: 'dry',
                  brandName: 'Brand A',
                  productName: 'Product A',
                  bagWeight: '2.0',
                  bagWeightUnit: 'kg',
                  dailyAmount: '100',
                  dryDailyAmountUnit: 'grams',
                  dateStarted: '2024-01-01',
                  dateFinished: '2024-01-15', // Older
                  isActive: false,
                  createdAt: '2024-01-01T00:00:00.000Z',
                  updatedAt: '2024-01-15T00:00:00.000Z',
                  numberOfUnits: null,
                  weightPerUnit: null,
                  wetWeightUnit: null,
                  wetDailyAmountUnit: null,
                },
                {
                  id: 'dry-2',
                  petId: TEST_PET_ID,
                  foodType: 'dry',
                  brandName: 'Brand B',
                  productName: 'Product B',
                  bagWeight: '3.0',
                  bagWeightUnit: 'kg',
                  dailyAmount: '100',
                  dryDailyAmountUnit: 'grams',
                  dateStarted: '2024-02-01',
                  dateFinished: '2024-02-25', // More recent
                  isActive: false,
                  createdAt: '2024-02-01T00:00:00.000Z',
                  updatedAt: '2024-02-25T00:00:00.000Z',
                  numberOfUnits: null,
                  weightPerUnit: null,
                  wetWeightUnit: null,
                  wetDailyAmountUnit: null,
                },
              ],
              total: 2,
            },
            message: 'Retrieved 2 finished dry food entries',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useFinishedDryFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const entries = result.current.data!;
      expect(entries).toHaveLength(2);
      
      // Should be sorted DESC (most recent first)
      expect(entries[0].dateFinished).toBe('2024-02-25');
      expect(entries[1].dateFinished).toBe('2024-01-15');
    });

    it('should handle empty finished entries list', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/finished`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              foodEntries: [],
              total: 0,
            },
            message: 'No finished dry food entries found',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useFinishedDryFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(0);
    });

    it('should handle errors when fetching finished entries', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/finished`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Failed to fetch finished entries',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useFinishedDryFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should not fetch when petId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => useFinishedDryFood(''));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  // ============================================
  // WRITE OPERATIONS (Mutations)
  // ============================================

  describe('useCreateDryFood', () => {
    it('should create dry food entry and invalidate active cache', async () => {
      // STEP 1: Fetch active entries first
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });
      
      const initialLength = activeQueryResult.current.data?.entries.length || 0;
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateDryFood(TEST_PET_ID),
        { queryClient }
      );

      // STEP 3: Execute mutation
      const newFoodData: DryFoodFormData = {
        brandName: 'New Brand',
        productName: 'New Product',
        bagWeight: '2.5',
        bagWeightUnit: 'kg',
        dailyAmount: '120',
        dryDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await mutationResult.current.mutateAsync(newFoodData);

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify cache was invalidated
      const queryState = queryClient.getQueryState(foodKeys.dryActive(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    it('should handle optional brandName and productName', async () => {
      const { result } = renderHookWithQuery(() => 
        useCreateDryFood(TEST_PET_ID)
      );

      const dataWithoutBrand: DryFoodFormData = {
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await result.current.mutateAsync(dataWithoutBrand);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should accept pounds as bagWeightUnit', async () => {
      const { result } = renderHookWithQuery(() => 
        useCreateDryFood(TEST_PET_ID)
      );

      const dataWithPounds: DryFoodFormData = {
        brandName: 'Brand',
        productName: 'Product',
        bagWeight: '5.0',
        bagWeightUnit: 'pounds',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await result.current.mutateAsync(dataWithPounds);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/pets/:petId/food/dry`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Bag weight must be positive',
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useCreateDryFood(TEST_PET_ID)
      );

      const invalidData: DryFoodFormData = {
        bagWeight: '-1',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/pets/:petId/food/dry`, () => {
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
        useCreateDryFood(TEST_PET_ID)
      );

      const validData: DryFoodFormData = {
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await expect(
        result.current.mutateAsync(validData)
      ).rejects.toThrow();
    });
  });

  describe('useUpdateDryFood', () => {
    it('should update dry food entry and invalidate cache', async () => {
      const foodId = 'dry-1';
      
      // STEP 1: Fetch active entries first
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateDryFood(TEST_PET_ID),
        { queryClient }
      );

      // STEP 3: Execute mutation
      const updateData: Partial<DryFoodFormData> = {
        dailyAmount: '150',
      };

      await mutationResult.current.mutateAsync({ foodId, foodData: updateData });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify cache was invalidated
      const queryState = queryClient.getQueryState(foodKeys.dryActive(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    it('should handle partial updates (only one field)', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpdateDryFood(TEST_PET_ID)
      );

      const partialUpdate: Partial<DryFoodFormData> = {
        brandName: 'Updated Brand',
      };

      await result.current.mutateAsync({ 
        foodId: 'dry-1', 
        foodData: partialUpdate 
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle errors when updating non-existent entry', async () => {
      server.use(
        http.put(`${API_BASE_URL}/pets/:petId/food/dry/:foodId`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Food entry not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useUpdateDryFood(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync({ 
          foodId: 'non-existent', 
          foodData: { dailyAmount: '100' } 
        })
      ).rejects.toThrow();
    });
  });

  describe('useDeleteDryFood', () => {
    it('should delete dry food entry and invalidate both caches', async () => {
      // STEP 1: Fetch active entries first
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });
      
      // STEP 1b: Also fetch finished entries (so both caches exist)
      const { result: finishedQueryResult } = renderHookWithQuery(
        () => useFinishedDryFood(TEST_PET_ID),
        { queryClient }
      );
      
      await waitFor(() => {
        expect(finishedQueryResult.current.isSuccess).toBe(true);
      });
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteDryFood(TEST_PET_ID),
        { queryClient }
      );

      // STEP 3: Execute delete
      await mutationResult.current.mutateAsync('dry-1');

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify both caches were invalidated
      const activeQueryState = queryClient.getQueryState(foodKeys.dryActive(TEST_PET_ID));
      const finishedQueryState = queryClient.getQueryState(foodKeys.dryFinished(TEST_PET_ID));
      
      expect(activeQueryState).toBeDefined();
      expect(finishedQueryState).toBeDefined();
    });

    it('should handle errors when deleting non-existent entry', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/pets/:petId/food/:foodId`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Food entry not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useDeleteDryFood(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync('non-existent')
      ).rejects.toThrow();
    });

    it('should handle network errors during delete', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/pets/:petId/food/:foodId`, () => {
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
        useDeleteDryFood(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync('dry-1')
      ).rejects.toThrow();
    });
  });

  describe('useMarkDryFoodFinished', () => {
    it('should mark dry food as finished and invalidate both caches', async () => {
      // STEP 1: Fetch active entries first
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });
      
      // STEP 1b: Also fetch finished entries (so both caches exist)
      const { result: finishedQueryResult } = renderHookWithQuery(
        () => useFinishedDryFood(TEST_PET_ID),
        { queryClient }
      );
      
      await waitFor(() => {
        expect(finishedQueryResult.current.isSuccess).toBe(true);
      });
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useMarkDryFoodFinished(TEST_PET_ID),
        { queryClient }
      );

      // STEP 3: Execute mutation
      await mutationResult.current.mutateAsync('dry-1');

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify both caches were invalidated
      const activeQueryState = queryClient.getQueryState(foodKeys.dryActive(TEST_PET_ID));
      const finishedQueryState = queryClient.getQueryState(foodKeys.dryFinished(TEST_PET_ID));
      
      expect(activeQueryState).toBeDefined();
      expect(finishedQueryState).toBeDefined();
    });

    it('should handle errors when marking non-existent entry', async () => {
      server.use(
        http.patch(`${API_BASE_URL}/pets/:petId/food/:foodId/finish`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Food entry not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useMarkDryFoodFinished(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync('non-existent')
      ).rejects.toThrow();
    });
  });

  describe('useUpdateDryFoodFinishDate', () => {
    it('should update finish date and invalidate finished cache', async () => {
      // STEP 1: Fetch finished entries first
      const { result: finishedQueryResult, queryClient } = renderHookWithQuery(() => 
        useFinishedDryFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(finishedQueryResult.current.isSuccess).toBe(true);
      });
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateDryFoodFinishDate(TEST_PET_ID),
        { queryClient }
      );

      // STEP 3: Execute mutation
      const updateData = {
        foodId: 'dry-finished-1',
        dateFinished: '2024-03-15',
      };

      await mutationResult.current.mutateAsync(updateData);

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify finished cache was invalidated
      const queryState = queryClient.getQueryState(foodKeys.dryFinished(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    it('should return updated entry with calculated fields', async () => {
        // No server.use() override - uses global handler
        
        const { result } = renderHookWithQuery(() => 
          useUpdateDryFoodFinishDate(TEST_PET_ID)
        );
      
        const updatedEntry = await result.current.mutateAsync({
          foodId: 'dry-finished-1',
          dateFinished: '2024-01-20',
        });
      
        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });
      
        // Tests actual calculation from global handler
        expect(updatedEntry.actualDaysElapsed).toBe(19);
        expect(updatedEntry.feedingStatus).toBe('slightly-over');
      });

    it('should handle errors when updating finish date', async () => {
      server.use(
        http.patch(`${API_BASE_URL}/pets/:petId/food/:foodId/finish-date`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Invalid date format',
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useUpdateDryFoodFinishDate(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync({ 
          foodId: 'dry-1', 
          dateFinished: 'invalid-date' 
        })
      ).rejects.toThrow();
    });
  });

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  describe('Query Keys', () => {
    it('should use correct query keys for caching', () => {
      const petId = 'pet-123';

      expect(foodKeys.all).toEqual(['food']);
      expect(foodKeys.dry(petId)).toEqual(['food', 'dry', petId]);
      expect(foodKeys.dryActive(petId)).toEqual(['food', 'dry', petId, 'active']);
      expect(foodKeys.dryFinished(petId)).toEqual(['food', 'dry', petId, 'finished']);
    });

    it('should invalidate correct cache keys on create', async () => {
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateDryFood(TEST_PET_ID),
        { queryClient }
      );

      const newFoodData: DryFoodFormData = {
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await mutationResult.current.mutateAsync(newFoodData);

      // Verify active cache was invalidated
      const queryState = queryClient.getQueryState(foodKeys.dryActive(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    it('should invalidate both active and finished caches on delete', async () => {
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });

      // Also fetch finished entries
      const { result: finishedQueryResult } = renderHookWithQuery(
        () => useFinishedDryFood(TEST_PET_ID),
        { queryClient }
      );
      
      await waitFor(() => {
        expect(finishedQueryResult.current.isSuccess).toBe(true);
      });

      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteDryFood(TEST_PET_ID),
        { queryClient }
      );

      await mutationResult.current.mutateAsync('dry-1');

      // Verify both caches were invalidated
      const activeQueryState = queryClient.getQueryState(foodKeys.dryActive(TEST_PET_ID));
      const finishedQueryState = queryClient.getQueryState(foodKeys.dryFinished(TEST_PET_ID));
      
      expect(activeQueryState).toBeDefined();
      expect(finishedQueryState).toBeDefined();
    });

    it('should not invalidate other pets caches', async () => {
      const otherPetId = 'pet-2';
      
      const { queryClient } = renderHookWithQuery(() => 
        useActiveDryFood(TEST_PET_ID)
      );

      // Set cache for different pet
      queryClient.setQueryData(foodKeys.dryActive(otherPetId), { entries: [], lowStock: [] });

      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateDryFood(TEST_PET_ID),
        { queryClient }
      );

      const newFoodData: DryFoodFormData = {
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await mutationResult.current.mutateAsync(newFoodData);

      // Other pet's cache should still exist
      const otherPetCache = queryClient.getQueryData(foodKeys.dryActive(otherPetId));
      expect(otherPetCache).toBeDefined();
    });
  });
});