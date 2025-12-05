/**
 * Wet Food Queries Test Suite
 * 
 * Tests all React Query hooks in src/queries/food/wetFood.ts
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
  useActiveWetFood,
  useFinishedWetFood,
  useCreateWetFood,
  useUpdateWetFood,
  useDeleteWetFood,
  useMarkWetFoodFinished,
  useUpdateWetFoodFinishDate,
  foodKeys,
} from '@/queries/food';
import { mockActiveWetFood, mockFinishedWetFood, resetMockWetFood } from '@/test/mocks/handlers';
import type { WetFoodEntry, WetFoodFormData } from '@/types/food';

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_PET_ID = 'pet-1';

describe('Wet Food Queries', () => {
  
  beforeEach(() => {
    resetMockWetFood();
  });

  console.log('🧪 Wet Food Test suite loading');

  // ============================================
  // READ OPERATIONS (Queries)
  // ============================================

  describe('useActiveWetFood', () => {
    it('should fetch and return active wet food entries', async () => {
      const { result } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );

      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.entries).toBeDefined();
      expect(result.current.data?.lowStock).toBeDefined();
      expect(Array.isArray(result.current.data?.entries)).toBe(true);
      expect(Array.isArray(result.current.data?.lowStock)).toBe(true);
    });

    it('should calculate low stock entries correctly (remainingDays <= 7)', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/wet`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              foodEntries: [
                {
                  id: 'wet-1',
                  petId: TEST_PET_ID,
                  foodType: 'wet',
                  brandName: 'Brand A',
                  productName: 'Product A',
                  numberOfUnits: 12,
                  weightPerUnit: '85',
                  wetWeightUnit: 'grams',
                  dailyAmount: '170',
                  wetDailyAmountUnit: 'grams',
                  dateStarted: '2024-01-01',
                  dateFinished: null,
                  isActive: true,
                  remainingDays: 5,
                  remainingWeight: 850,
                  createdAt: '2024-01-01T00:00:00.000Z',
                  updatedAt: '2024-01-01T00:00:00.000Z',
                  bagWeight: null,
                  bagWeightUnit: null,
                  dryDailyAmountUnit: null,
                },
                {
                  id: 'wet-2',
                  petId: TEST_PET_ID,
                  foodType: 'wet',
                  brandName: 'Brand B',
                  productName: 'Product B',
                  numberOfUnits: 24,
                  weightPerUnit: '85',
                  wetWeightUnit: 'grams',
                  dailyAmount: '170',
                  wetDailyAmountUnit: 'grams',
                  dateStarted: '2024-01-15',
                  dateFinished: null,
                  isActive: true,
                  remainingDays: 20,
                  remainingWeight: 3400,
                  createdAt: '2024-01-15T00:00:00.000Z',
                  updatedAt: '2024-01-15T00:00:00.000Z',
                  bagWeight: null,
                  bagWeightUnit: null,
                  dryDailyAmountUnit: null,
                },
              ],
              total: 2,
            },
            message: 'Retrieved 2 wet food entries',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const { entries, lowStock } = result.current.data!;
      
      expect(entries).toHaveLength(2);
      expect(lowStock).toHaveLength(1);
      expect(lowStock[0].id).toBe('wet-1');
      expect(lowStock[0].remainingDays).toBe(5);
    });

    it('should exclude entries with remainingDays > 7 from low stock', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/wet`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              foodEntries: [
                {
                  id: 'wet-1',
                  petId: TEST_PET_ID,
                  foodType: 'wet',
                  brandName: 'Brand A',
                  productName: 'Product A',
                  numberOfUnits: 12,
                  weightPerUnit: '85',
                  wetWeightUnit: 'grams',
                  dailyAmount: '170',
                  wetDailyAmountUnit: 'grams',
                  dateStarted: '2024-01-01',
                  dateFinished: null,
                  isActive: true,
                  remainingDays: 10,
                  remainingWeight: 1700,
                  createdAt: '2024-01-01T00:00:00.000Z',
                  updatedAt: '2024-01-01T00:00:00.000Z',
                  bagWeight: null,
                  bagWeightUnit: null,
                  dryDailyAmountUnit: null,
                },
              ],
              total: 1,
            },
            message: 'Retrieved 1 wet food entry',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.lowStock).toHaveLength(0);
    });

    it('should exclude entries with remainingDays <= 0 from low stock', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/wet`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              foodEntries: [
                {
                  id: 'wet-1',
                  petId: TEST_PET_ID,
                  foodType: 'wet',
                  brandName: 'Brand A',
                  productName: 'Product A',
                  numberOfUnits: 12,
                  weightPerUnit: '85',
                  wetWeightUnit: 'grams',
                  dailyAmount: '170',
                  wetDailyAmountUnit: 'grams',
                  dateStarted: '2024-01-01',
                  dateFinished: null,
                  isActive: true,
                  remainingDays: 0,
                  remainingWeight: 0,
                  createdAt: '2024-01-01T00:00:00.000Z',
                  updatedAt: '2024-01-01T00:00:00.000Z',
                  bagWeight: null,
                  bagWeightUnit: null,
                  dryDailyAmountUnit: null,
                },
              ],
              total: 1,
            },
            message: 'Retrieved 1 wet food entry',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.lowStock).toHaveLength(0);
    });

    it('should handle empty active entries list', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/wet`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              foodEntries: [],
              total: 0,
            },
            message: 'No wet food entries found',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.entries).toHaveLength(0);
      expect(result.current.data?.lowStock).toHaveLength(0);
    });

    it('should handle errors when fetching active entries', async () => {
      server.use(
        http.get(`${API_BASE_URL}/pets/:petId/food/wet`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Failed to fetch wet food entries',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
    });

    it('should not fetch when petId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => useActiveWetFood(''));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useFinishedWetFood', () => {
    it('should fetch and return finished wet food entries', async () => {
      const { result } = renderHookWithQuery(() => 
        useFinishedWetFood(TEST_PET_ID)
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
                  id: 'wet-1',
                  petId: TEST_PET_ID,
                  foodType: 'wet',
                  brandName: 'Brand A',
                  productName: 'Product A',
                  numberOfUnits: 12,
                  weightPerUnit: '85',
                  wetWeightUnit: 'grams',
                  dailyAmount: '170',
                  wetDailyAmountUnit: 'grams',
                  dateStarted: '2024-01-01',
                  dateFinished: '2024-01-15',
                  isActive: false,
                  createdAt: '2024-01-01T00:00:00.000Z',
                  updatedAt: '2024-01-15T00:00:00.000Z',
                  bagWeight: null,
                  bagWeightUnit: null,
                  dryDailyAmountUnit: null,
                },
                {
                  id: 'wet-2',
                  petId: TEST_PET_ID,
                  foodType: 'wet',
                  brandName: 'Brand B',
                  productName: 'Product B',
                  numberOfUnits: 24,
                  weightPerUnit: '85',
                  wetWeightUnit: 'grams',
                  dailyAmount: '170',
                  wetDailyAmountUnit: 'grams',
                  dateStarted: '2024-02-01',
                  dateFinished: '2024-02-25',
                  isActive: false,
                  createdAt: '2024-02-01T00:00:00.000Z',
                  updatedAt: '2024-02-25T00:00:00.000Z',
                  bagWeight: null,
                  bagWeightUnit: null,
                  dryDailyAmountUnit: null,
                },
              ],
              total: 2,
            },
            message: 'Retrieved 2 finished wet food entries',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useFinishedWetFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const entries = result.current.data!;
      expect(entries).toHaveLength(2);
      
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
            message: 'No finished wet food entries found',
          });
        })
      );

      const { result } = renderHookWithQuery(() => 
        useFinishedWetFood(TEST_PET_ID)
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
        useFinishedWetFood(TEST_PET_ID)
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should not fetch when petId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => useFinishedWetFood(''));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  // ============================================
  // WRITE OPERATIONS (Mutations)
  // ============================================

  describe('useCreateWetFood', () => {
    it('should create wet food entry and invalidate active cache', async () => {
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateWetFood(TEST_PET_ID),
        { queryClient }
      );

      const newFoodData: WetFoodFormData = {
        brandName: 'New Brand',
        productName: 'New Product',
        numberOfUnits: '12',
        weightPerUnit: '100',
        wetWeightUnit: 'grams',
        dailyAmount: '200',
        wetDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await mutationResult.current.mutateAsync(newFoodData);

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      const queryState = queryClient.getQueryState(foodKeys.wetActive(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    it('should handle optional brandName and productName', async () => {
      const { result } = renderHookWithQuery(() => 
        useCreateWetFood(TEST_PET_ID)
      );

      const dataWithoutBrand: WetFoodFormData = {
        numberOfUnits: '12',
        weightPerUnit: '85',
        wetWeightUnit: 'grams',
        dailyAmount: '170',
        wetDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await result.current.mutateAsync(dataWithoutBrand);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should accept oz as wetWeightUnit', async () => {
      const { result } = renderHookWithQuery(() => 
        useCreateWetFood(TEST_PET_ID)
      );

      const dataWithOz: WetFoodFormData = {
        brandName: 'Brand',
        productName: 'Product',
        numberOfUnits: '24',
        weightPerUnit: '3',
        wetWeightUnit: 'oz',
        dailyAmount: '6',
        wetDailyAmountUnit: 'oz',
        dateStarted: '2024-03-01',
      };

      await result.current.mutateAsync(dataWithOz);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/pets/:petId/food/wet`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Number of units must be positive',
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => 
        useCreateWetFood(TEST_PET_ID)
      );

      const invalidData: WetFoodFormData = {
        numberOfUnits: '-1',
        weightPerUnit: '85',
        wetWeightUnit: 'grams',
        dailyAmount: '170',
        wetDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/pets/:petId/food/wet`, () => {
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
        useCreateWetFood(TEST_PET_ID)
      );

      const validData: WetFoodFormData = {
        numberOfUnits: '12',
        weightPerUnit: '85',
        wetWeightUnit: 'grams',
        dailyAmount: '170',
        wetDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await expect(
        result.current.mutateAsync(validData)
      ).rejects.toThrow();
    });
  });

  describe('useUpdateWetFood', () => {
    it('should update wet food entry and invalidate cache', async () => {
      const foodId = 'wet-1';
      
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateWetFood(TEST_PET_ID),
        { queryClient }
      );

      const updateData: Partial<WetFoodFormData> = {
        dailyAmount: '200',
      };

      await mutationResult.current.mutateAsync({ foodId, foodData: updateData });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      const queryState = queryClient.getQueryState(foodKeys.wetActive(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    it('should handle partial updates (only one field)', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpdateWetFood(TEST_PET_ID)
      );

      const partialUpdate: Partial<WetFoodFormData> = {
        brandName: 'Updated Brand',
      };

      await result.current.mutateAsync({ 
        foodId: 'wet-1', 
        foodData: partialUpdate 
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle errors when updating non-existent entry', async () => {
      server.use(
        http.put(`${API_BASE_URL}/pets/:petId/food/wet/:foodId`, () => {
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
        useUpdateWetFood(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync({ 
          foodId: 'non-existent', 
          foodData: { dailyAmount: '170' } 
        })
      ).rejects.toThrow();
    });
  });

  describe('useDeleteWetFood', () => {
    it('should delete wet food entry and invalidate both caches', async () => {
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: finishedQueryResult } = renderHookWithQuery(
        () => useFinishedWetFood(TEST_PET_ID),
        { queryClient }
      );
      
      await waitFor(() => {
        expect(finishedQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteWetFood(TEST_PET_ID),
        { queryClient }
      );

      await mutationResult.current.mutateAsync('wet-1');

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      const activeQueryState = queryClient.getQueryState(foodKeys.wetActive(TEST_PET_ID));
      const finishedQueryState = queryClient.getQueryState(foodKeys.wetFinished(TEST_PET_ID));
      
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
        useDeleteWetFood(TEST_PET_ID)
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
        useDeleteWetFood(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync('wet-1')
      ).rejects.toThrow();
    });
  });

  describe('useMarkWetFoodFinished', () => {
    it('should mark wet food as finished and invalidate both caches', async () => {
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: finishedQueryResult } = renderHookWithQuery(
        () => useFinishedWetFood(TEST_PET_ID),
        { queryClient }
      );
      
      await waitFor(() => {
        expect(finishedQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useMarkWetFoodFinished(TEST_PET_ID),
        { queryClient }
      );

      await mutationResult.current.mutateAsync('wet-1');

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      const activeQueryState = queryClient.getQueryState(foodKeys.wetActive(TEST_PET_ID));
      const finishedQueryState = queryClient.getQueryState(foodKeys.wetFinished(TEST_PET_ID));
      
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
        useMarkWetFoodFinished(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync('non-existent')
      ).rejects.toThrow();
    });
  });

  describe('useUpdateWetFoodFinishDate', () => {
    it('should update finish date and invalidate finished cache', async () => {
      const { result: finishedQueryResult, queryClient } = renderHookWithQuery(() => 
        useFinishedWetFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(finishedQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateWetFoodFinishDate(TEST_PET_ID),
        { queryClient }
      );

      const updateData = {
        foodId: 'wet-finished-1',
        dateFinished: '2024-01-20',
      };

      await mutationResult.current.mutateAsync(updateData);

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      const queryState = queryClient.getQueryState(foodKeys.wetFinished(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    it('should return updated entry with calculated fields', async () => {
      const { result } = renderHookWithQuery(() => 
        useUpdateWetFoodFinishDate(TEST_PET_ID)
      );

      const updateData = {
        foodId: 'wet-finished-1',
        dateFinished: '2024-01-20',
      };

      const updatedEntry = await result.current.mutateAsync(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(updatedEntry.actualDaysElapsed).toBe(19);
      expect(updatedEntry.feedingStatus).toBe('slightly-over');
    });

    it('should handle errors when updating finish date', async () => {
      server.use(
        http.put(`${API_BASE_URL}/pets/:petId/food/:foodId/finish-date`, () => {
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
        useUpdateWetFoodFinishDate(TEST_PET_ID)
      );

      await expect(
        result.current.mutateAsync({ 
          foodId: 'wet-1', 
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
      expect(foodKeys.wet(petId)).toEqual(['food', 'wet', petId]);
      expect(foodKeys.wetActive(petId)).toEqual(['food', 'wet', petId, 'active']);
      expect(foodKeys.wetFinished(petId)).toEqual(['food', 'wet', petId, 'finished']);
    });

    it('should invalidate correct cache keys on create', async () => {
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateWetFood(TEST_PET_ID),
        { queryClient }
      );

      const newFoodData: WetFoodFormData = {
        numberOfUnits: '12',
        weightPerUnit: '85',
        wetWeightUnit: 'grams',
        dailyAmount: '170',
        wetDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await mutationResult.current.mutateAsync(newFoodData);

      const queryState = queryClient.getQueryState(foodKeys.wetActive(TEST_PET_ID));
      expect(queryState).toBeDefined();
    });

    it('should invalidate both active and finished caches on delete', async () => {
      const { result: activeQueryResult, queryClient } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );
      
      await waitFor(() => {
        expect(activeQueryResult.current.isSuccess).toBe(true);
      });

      const { result: finishedQueryResult } = renderHookWithQuery(
        () => useFinishedWetFood(TEST_PET_ID),
        { queryClient }
      );
      
      await waitFor(() => {
        expect(finishedQueryResult.current.isSuccess).toBe(true);
      });

      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteWetFood(TEST_PET_ID),
        { queryClient }
      );

      await mutationResult.current.mutateAsync('wet-1');

      const activeQueryState = queryClient.getQueryState(foodKeys.wetActive(TEST_PET_ID));
      const finishedQueryState = queryClient.getQueryState(foodKeys.wetFinished(TEST_PET_ID));
      
      expect(activeQueryState).toBeDefined();
      expect(finishedQueryState).toBeDefined();
    });

    it('should not invalidate other pets caches', async () => {
      const otherPetId = 'pet-2';
      
      const { queryClient } = renderHookWithQuery(() => 
        useActiveWetFood(TEST_PET_ID)
      );

      queryClient.setQueryData(foodKeys.wetActive(otherPetId), { entries: [], lowStock: [] });

      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateWetFood(TEST_PET_ID),
        { queryClient }
      );

      const newFoodData: WetFoodFormData = {
        numberOfUnits: '12',
        weightPerUnit: '85',
        wetWeightUnit: 'grams',
        dailyAmount: '170',
        wetDailyAmountUnit: 'grams',
        dateStarted: '2024-03-01',
      };

      await mutationResult.current.mutateAsync(newFoodData);

      const otherPetCache = queryClient.getQueryData(foodKeys.wetActive(otherPetId));
      expect(otherPetCache).toBeDefined();
    });
  });
});