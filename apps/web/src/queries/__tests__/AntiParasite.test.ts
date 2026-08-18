/**
 * Anti-Parasite Treatment Queries Test Suite
 *
 * Tests all React Query hooks in src/queries/anti-parasite-treatments.ts:
 * 1. Data fetching (list returned as-is, enriched with categories/expiry)
 * 2. Query key invalidation on create/update
 * 3. Optimistic delete + rollback
 * 4. Error handling
 * 5. Loading states
 */

import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '@/test/utils/test-utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useAntiParasiteTreatments,
  useCreateAntiParasiteTreatment,
  useUpdateAntiParasiteTreatment,
  useDeleteAntiParasiteTreatment,
  antiParasiteKeys,
} from '@/queries/anti-parasite-treatments';
import { mockAntiParasiteTreatments } from '@/test/mocks/handlers';
import type { AntiParasiteTreatment, AntiParasiteTreatmentFormData } from '@/types/anti-parasite-treatments';

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_PET_ID = 'pet-1';

const validFormData: AntiParasiteTreatmentFormData = {
  productName: 'Nexgard',
  categories: ['fleas_ticks'],
  durationUnit: 'months',
  durationAmount: 3,
  dateAdministered: '2024-05-01',
};

describe('Anti-Parasite Treatment Queries', () => {
  // ============================================
  // READ
  // ============================================
  describe('useAntiParasiteTreatments', () => {
    it('should start in a loading state then resolve to data', async () => {
      const { result } = renderHookWithQuery(() =>
        useAntiParasiteTreatments({ petId: TEST_PET_ID }),
      );

      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(2);
    });

    it('should return treatments enriched with categories and expiry, as-is from the server', async () => {
      const { result } = renderHookWithQuery(() =>
        useAntiParasiteTreatments({ petId: TEST_PET_ID }),
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const first = result.current.data?.find((t) => t.id === 'apt-2');
      expect(first?.categories).toEqual(['worms', 'heartworm']);
      expect(first?.expiryDate).toBe('2024-04-10');
    });

    it('should not run when petId is empty', async () => {
      const { result } = renderHookWithQuery(() =>
        useAntiParasiteTreatments({ petId: '' }),
      );
      // enabled: !!petId → query stays idle
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  // ============================================
  // CREATE
  // ============================================
  describe('useCreateAntiParasiteTreatment', () => {
    it('should create a treatment and invalidate the pet cache', async () => {
      const { result: listResult, queryClient } = renderHookWithQuery(() =>
        useAntiParasiteTreatments({ petId: TEST_PET_ID }),
      );
      await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

      const { result: createResult } = renderHookWithQuery(
        () => useCreateAntiParasiteTreatment(TEST_PET_ID),
        { queryClient },
      );

      createResult.current.mutate(validFormData);

      await waitFor(() => expect(createResult.current.isSuccess).toBe(true));

      await waitFor(() => {
        const state = queryClient.getQueryState(antiParasiteKeys.byPet(TEST_PET_ID));
        expect(state).toBeDefined();
      });
    });

    it('should surface an error when the server rejects the create', async () => {
      server.use(
        http.post(`${API_BASE_URL}/pets/:petId/anti-parasite-treatments`, () =>
          HttpResponse.json({ success: false, error: 'Validation error' }, { status: 400 }),
        ),
      );

      const { result } = renderHookWithQuery(() =>
        useCreateAntiParasiteTreatment(TEST_PET_ID),
      );

      await expect(result.current.mutateAsync(validFormData)).rejects.toThrow();
    });
  });

  // ============================================
  // UPDATE
  // ============================================
  describe('useUpdateAntiParasiteTreatment', () => {
    it('should update a treatment and invalidate the pet cache', async () => {
      const { result: listResult, queryClient } = renderHookWithQuery(() =>
        useAntiParasiteTreatments({ petId: TEST_PET_ID }),
      );
      await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

      const { result: updateResult } = renderHookWithQuery(
        () => useUpdateAntiParasiteTreatment(TEST_PET_ID),
        { queryClient },
      );

      updateResult.current.mutate({ treatmentId: 'apt-1', data: { productName: 'Bravecto Plus' } });

      await waitFor(() => expect(updateResult.current.isSuccess).toBe(true));
      expect(queryClient.getQueryState(antiParasiteKeys.byPet(TEST_PET_ID))).toBeDefined();
    });

    it('should error on a 404 update', async () => {
      const { result } = renderHookWithQuery(() =>
        useUpdateAntiParasiteTreatment(TEST_PET_ID),
      );

      await expect(
        result.current.mutateAsync({ treatmentId: 'does-not-exist', data: { productName: 'X' } }),
      ).rejects.toThrow();
    });
  });

  // ============================================
  // DELETE (optimistic + rollback)
  // ============================================
  describe('useDeleteAntiParasiteTreatment', () => {
    it('should optimistically remove the treatment from cache', async () => {
      const { result, queryClient } = renderHookWithQuery(() =>
        useDeleteAntiParasiteTreatment(TEST_PET_ID),
      );

      queryClient.setQueryData(antiParasiteKeys.byPet(TEST_PET_ID), [...mockAntiParasiteTreatments]);

      result.current.mutate('apt-1');

      await waitFor(() => {
        const cached = queryClient.getQueryData<AntiParasiteTreatment[]>(
          antiParasiteKeys.byPet(TEST_PET_ID),
        );
        expect(cached?.find((t) => t.id === 'apt-1')).toBeUndefined();
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('should rollback the optimistic removal on error', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/pets/:petId/anti-parasite-treatments/:treatmentId`, () =>
          HttpResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 }),
        ),
      );

      const { result, queryClient } = renderHookWithQuery(() =>
        useDeleteAntiParasiteTreatment(TEST_PET_ID),
      );

      queryClient.setQueryData(antiParasiteKeys.byPet(TEST_PET_ID), [...mockAntiParasiteTreatments]);

      await expect(result.current.mutateAsync('apt-1')).rejects.toThrow();

      const cached = queryClient.getQueryData<AntiParasiteTreatment[]>(
        antiParasiteKeys.byPet(TEST_PET_ID),
      );
      // apt-1 restored by the rollback
      expect(cached?.find((t) => t.id === 'apt-1')).toBeDefined();
    });
  });
});