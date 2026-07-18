/**
 * Veterinarians Queries Test Suite
 *
 * Tests all React Query hooks in src/queries/vets.ts
 *
 * What we're testing:
 * 1. Data fetching (all vets, single vet, pet-vet assignments)
 * 2. CRUD operations (create, update, delete)
 * 3. Pet assignment operations (assign, unassign)
 * 4. Cross-domain cache coordination:
 *    - vet mutations refetch pet-side caches (['pets', petId, 'vets'])
 *    - vet mutations do NOT refetch signed image URLs (deliberate exclusion)
 * 5. Error handling (validation, network, not found)
 * 6. Loading states and cache operations
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
import { usePetSignedUrl, petKeys } from '@/queries/pets';
import { mockVeterinarians, resetMockVeterinarians } from '@/test/mocks/handlers';
import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';

const API_BASE_URL = 'http://localhost:3001/api';

// Shared minimal valid form data — DRY across create tests
const buildVetFormData = (
  overrides: Partial<VeterinarianFormData> = {}
): VeterinarianFormData => ({
  vetName: 'Dr. Test Vet',
  clinicName: '',
  phone: '555-1234',
  email: '',
  website: '',
  addressLine1: '123 Main St',
  addressLine2: '',
  city: 'Boston',
  zipCode: '02101',
  notes: '',
  ...overrides,
});

describe('Veterinarians Queries', () => {
  beforeEach(() => {
    resetMockVeterinarians();
  });

  // ============================================
  // READ OPERATIONS (Queries)
  // ============================================

  describe('useVeterinarians', () => {
    it('should fetch and return all veterinarians', async () => {
      const { result } = renderHookWithQuery(() => useVeterinarians());

      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockVeterinarians);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].vetName).toBe('Dr. Sarah Johnson');
    });

    it('should handle empty veterinarians list', async () => {
      server.use(
        http.get(`${API_BASE_URL}/vets`, () => {
          return HttpResponse.json({
            success: true,
            data: { veterinarians: [], total: 0 },
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
      server.use(
        http.get(`${API_BASE_URL}/vets`, () => {
          return HttpResponse.json(
            { success: false, error: 'Internal server error' },
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
      server.use(
        http.get(`${API_BASE_URL}/vets/:id`, () => {
          return HttpResponse.json(
            { success: false, error: 'Veterinarian not found' },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useVeterinarian('vet-999'));

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should not fetch when vetId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => useVeterinarian(''));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useVetPets', () => {
    it('should fetch pets assigned to a veterinarian', async () => {
      const { result } = renderHookWithQuery(() => useVetPets('vet-1'));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data?.[0]).toHaveProperty('petId');
    });

    it('should return empty array when no pets assigned', async () => {
      server.use(
        http.get(`${API_BASE_URL}/vets/:id/pets`, () => {
          return HttpResponse.json({
            success: true,
            data: { pets: [] },
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
      const { result } = renderHookWithQuery(() => usePetVets('pet-1'));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data?.[0]?.id).toBe('vet-1');
    });

    it('should return empty array when no vets assigned', async () => {
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
      const { result } = renderHookWithQuery(() => useVeterinarianFromCache('vet-1'));

      expect(result.current).toBeUndefined();
    });

    it('should return veterinarian from cache after fetching', async () => {
      const vetId = 'vet-1';

      const { result: fetchResult, queryClient } = renderHookWithQuery(() =>
        useVeterinarian(vetId)
      );

      await waitFor(() => {
        expect(fetchResult.current.isSuccess).toBe(true);
      });

      const { result: cacheResult } = renderHookWithQuery(
        () => useVeterinarianFromCache(vetId),
        { queryClient }
      );

      expect(cacheResult.current?.id).toBe(vetId);
      expect(cacheResult.current?.vetName).toBe('Dr. Sarah Johnson');
    });
  });

  // ============================================
  // WRITE OPERATIONS (Mutations)
  // ============================================

  describe('useCreateVeterinarian', () => {
    it('should create new veterinarian and refetch the vets list', async () => {
      const { result: vetsQueryResult, queryClient } = renderHookWithQuery(() =>
        useVeterinarians()
      );

      await waitFor(() => {
        expect(vetsQueryResult.current.isSuccess).toBe(true);
      });
      expect(vetsQueryResult.current.data).toHaveLength(2);

      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateVeterinarian(),
        { queryClient }
      );

      // Execute mutation directly — never inside waitFor (waitFor retries
      // its callback, which would re-run the mutation)
      const createdVet = await mutationResult.current.mutateAsync({
        vetData: buildVetFormData({
          vetName: 'Dr. Michael Brown',
          clinicName: 'Pet Care Center',
        }),
      });

      expect(createdVet.vetName).toBe('Dr. Michael Brown');
      expect(createdVet.clinicName).toBe('Pet Care Center');

      // Behavioral invalidation check: the active list observer refetches
      // and now includes the new vet
      await waitFor(() => {
        expect(vetsQueryResult.current.data).toHaveLength(3);
        expect(
          vetsQueryResult.current.data?.find((v) => v.vetName === 'Dr. Michael Brown')
        ).toBeDefined();
      });
    });

    it('should create veterinarian with pet assignments', async () => {
      const { queryClient } = renderHookWithQuery(() => useVeterinarians());

      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateVeterinarian(),
        { queryClient }
      );

      const createdVet = await mutationResult.current.mutateAsync({
        vetData: buildVetFormData({ vetName: 'Dr. Emily Davis' }),
        petIds: ['pet-1', 'pet-2'],
      });

      expect(createdVet.vetName).toBe('Dr. Emily Davis');
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/vets`, () => {
          return HttpResponse.json(
            { success: false, error: 'Veterinarian name is required' },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useCreateVeterinarian());

      await expect(
        result.current.mutateAsync({ vetData: buildVetFormData({ vetName: '' }) })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdateVeterinarian', () => {
    it('should update veterinarian and refetch list and detail caches', async () => {
      const vetId = 'vet-1';

      const { result: vetsListResult, queryClient } = renderHookWithQuery(() =>
        useVeterinarians()
      );
      await waitFor(() => {
        expect(vetsListResult.current.isSuccess).toBe(true);
      });
      expect(
        vetsListResult.current.data?.find((v) => v.id === vetId)?.vetName
      ).toBe('Dr. Sarah Johnson');

      // Mount detail observer on the SAME client. Its presence is what makes
      // the refetch assertion below meaningful: invalidateQueries only
      // auto-refetches queries with an ACTIVE observer — without this mount,
      // the detail entry would merely be marked stale, dataUpdatedAt would
      // never advance, and the test would fail.
      const { result: detailResult } = renderHookWithQuery(
        () => useVeterinarian(vetId),
        { queryClient }
      );
      await waitFor(() => {
        expect(detailResult.current.isSuccess).toBe(true);
      });

      const detailUpdatedAtBefore =
        queryClient.getQueryState(vetKeys.detail(vetId))?.dataUpdatedAt ?? 0;

      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateVeterinarian(),
        { queryClient }
      );

      await mutationResult.current.mutateAsync({
        vetId,
        vetData: {
          vetName: 'Dr. Sarah Johnson-Smith',
          clinicName: 'Updated Clinic Name',
        },
      });

      // Behavioral check 1: list observer refetches with updated data
      await waitFor(() => {
        const updatedInList = vetsListResult.current.data?.find((v) => v.id === vetId);
        expect(updatedInList?.vetName).toBe('Dr. Sarah Johnson-Smith');
        expect(updatedInList?.clinicName).toBe('Updated Clinic Name');
      });

      // Behavioral check 2: the detail query auto-refetched with fresh data,
      // proving vetKeys.all prefix-covered the detail key AND the mounted
      // observer triggered the refetch.
      // NOTE: asserted at the cache layer (dataUpdatedAt + getQueryData)
      // rather than via detailResult.current — with multiple renderHook
      // roots under happy-dom, the 2nd root's rendered output doesn't
      // reliably re-flush on external-store updates, even though the cache
      // and refetch behave correctly (verified: dataUpdateCount advanced,
      // MSW logged the refetch, cache held fresh data while result.current
      // stayed stale for 3s).
      await waitFor(() => {
        const detailUpdatedAtAfter =
          queryClient.getQueryState(vetKeys.detail(vetId))?.dataUpdatedAt ?? 0;
        expect(detailUpdatedAtAfter).toBeGreaterThan(detailUpdatedAtBefore);
        expect(
          queryClient.getQueryData<Veterinarian>(vetKeys.detail(vetId))?.vetName
        ).toBe('Dr. Sarah Johnson-Smith');
      });
    });

    it('should handle partial updates', async () => {
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

      await mutationResult.current.mutateAsync({
        vetId: 'vet-1',
        vetData: { phone: '555-0000' },
      });

      await waitFor(() => {
        expect(
          vetsListResult.current.data?.find((v) => v.id === 'vet-1')?.phone
        ).toBe('555-0000');
      });
    });

    it('should handle validation errors', async () => {
      server.use(
        http.put(`${API_BASE_URL}/vets/:id`, () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid email format' },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useUpdateVeterinarian());

      await expect(
        result.current.mutateAsync({
          vetId: 'vet-1',
          vetData: { email: 'invalid-email' },
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
            { success: false, error: 'Veterinarian not found' },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useUpdateVeterinarian());

      await expect(
        result.current.mutateAsync({ vetId: 'vet-999', vetData: { phone: '555-1234' } })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useDeleteVeterinarian', () => {
    it('should delete veterinarian, refetch list, and evict detail cache', async () => {
      const vetId = 'vet-2';

      const { result: vetsQueryResult, queryClient } = renderHookWithQuery(() =>
        useVeterinarians()
      );
      await waitFor(() => {
        expect(vetsQueryResult.current.isSuccess).toBe(true);
      });
      expect(vetsQueryResult.current.data).toHaveLength(2);

      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteVeterinarian(),
        { queryClient }
      );

      await mutationResult.current.mutateAsync(vetId);

      // Detail cache must be REMOVED (evicted), not merely invalidated —
      // removeQueries deletes the entry, so getQueryState returns undefined
      const detailQueryState = queryClient.getQueryState(vetKeys.detail(vetId));
      expect(detailQueryState).toBeUndefined();

      // Behavioral: list refetches without the deleted vet
      await waitFor(() => {
        expect(vetsQueryResult.current.data).toHaveLength(1);
        expect(vetsQueryResult.current.data?.find((v) => v.id === vetId)).toBeUndefined();
      });
    });

    it('should handle not found errors', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/vets/:id`, () => {
          return HttpResponse.json(
            { success: false, error: 'Veterinarian not found' },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useDeleteVeterinarian());

      await expect(result.current.mutateAsync('vet-999')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAssignVetToPets', () => {
    it('should assign vet to pets and refetch pet-side vet caches', async () => {
      const vetId = 'vet-1';

      // Mount the PET-side observer — the cache that feeds appointment
      // dropdowns and pet profiles (['pets', petId, 'vets'])
      const { result: petVetsResult, queryClient } = renderHookWithQuery(() =>
        usePetVets('pet-1')
      );
      await waitFor(() => {
        expect(petVetsResult.current.isSuccess).toBe(true);
      });

      const dataUpdatedAtBefore =
        queryClient.getQueryState(vetKeys.petVets('pet-1'))?.dataUpdatedAt ?? 0;

      const { result: mutationResult } = renderHookWithQuery(
        () => useAssignVetToPets(),
        { queryClient }
      );

      await mutationResult.current.mutateAsync({ vetId, petIds: ['pet-1', 'pet-2'] });

      // Timestamp-based refetch proof: dataUpdatedAt only advances when the
      // query actually refetches (race-free vs. checking isInvalidated,
      // which resets as soon as the refetch completes)
      await waitFor(() => {
        const dataUpdatedAtAfter =
          queryClient.getQueryState(vetKeys.petVets('pet-1'))?.dataUpdatedAt ?? 0;
        expect(dataUpdatedAtAfter).toBeGreaterThan(dataUpdatedAtBefore);
      });
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/vets/:id/assign`, () => {
          return HttpResponse.json(
            { success: false, error: 'Pet not found' },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useAssignVetToPets());

      await expect(
        result.current.mutateAsync({ vetId: 'vet-1', petIds: ['pet-999'] })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUnassignVetFromPets', () => {
    it('should unassign vet from pets and refetch pet-side vet caches', async () => {
      const { result: petVetsResult, queryClient } = renderHookWithQuery(() =>
        usePetVets('pet-1')
      );
      await waitFor(() => {
        expect(petVetsResult.current.isSuccess).toBe(true);
      });

      const dataUpdatedAtBefore =
        queryClient.getQueryState(vetKeys.petVets('pet-1'))?.dataUpdatedAt ?? 0;

      const { result: mutationResult } = renderHookWithQuery(
        () => useUnassignVetFromPets(),
        { queryClient }
      );

      await mutationResult.current.mutateAsync({ vetId: 'vet-1', petIds: ['pet-1'] });

      await waitFor(() => {
        const dataUpdatedAtAfter =
          queryClient.getQueryState(vetKeys.petVets('pet-1'))?.dataUpdatedAt ?? 0;
        expect(dataUpdatedAtAfter).toBeGreaterThan(dataUpdatedAtBefore);
      });
    });

    it('should handle not found errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/vets/:id/unassign`, () => {
          return HttpResponse.json(
            { success: false, error: 'Veterinarian not found' },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useUnassignVetFromPets());

      await expect(
        result.current.mutateAsync({ vetId: 'vet-999', petIds: ['pet-1'] })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ============================================
  // CROSS-DOMAIN CACHE COORDINATION
  // Regression coverage for the invalidatePetRelatedCaches helper:
  // vet mutations must refresh pet-side vet data (the stale-dropdown bug)
  // while sparing signed image URLs (the 55min caching strategy)
  // ============================================

  describe('cross-domain cache coordination', () => {
    it('REGRESSION: deleting a vet refetches pet-side vet lists (no stale dropdowns)', async () => {
      // The mock GET /pets/:petId/vets filters the live veterinariansList,
      // so deleting vet-1 genuinely empties pet-1's assigned vets — letting
      // us assert observable behavior, not invalidation flags
      const { result: petVetsResult, queryClient } = renderHookWithQuery(() =>
        usePetVets('pet-1')
      );
      await waitFor(() => {
        expect(petVetsResult.current.isSuccess).toBe(true);
      });
      expect(petVetsResult.current.data?.map((v) => v.id)).toContain('vet-1');

      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteVeterinarian(),
        { queryClient }
      );

      await mutationResult.current.mutateAsync('vet-1');

      // Without invalidatePetRelatedCaches in the delete mutation, this
      // observer would keep serving the stale list until a full page refresh
      await waitFor(() => {
        expect(petVetsResult.current.data).toEqual([]);
      });
    });

    it('vet mutations do NOT refetch pet signed-url caches (deliberate exclusion)', async () => {
      // Signed URLs have a 55min staleTime by design (Supabase URL expiry).
      // invalidateQueries ignores staleTime, so if the predicate exclusion
      // in invalidatePetRelatedCaches were removed, this query WOULD refetch
      // and dataUpdatedAt would advance — this test pins the exclusion.
      const { result: signedUrlResult, queryClient } = renderHookWithQuery(() =>
        usePetSignedUrl('pet-1', true)
      );
      await waitFor(() => {
        expect(signedUrlResult.current.isSuccess).toBe(true);
      });

      // Also mount a pet-side vets observer to prove the same mutation DOES
      // invalidate its sibling under the ['pets'] prefix — ruling out the
      // trivial pass where nothing was invalidated at all
      const { result: petVetsResult } = renderHookWithQuery(
        () => usePetVets('pet-1'),
        { queryClient }
      );
      await waitFor(() => {
        expect(petVetsResult.current.isSuccess).toBe(true);
      });

      const signedUrlUpdatedAtBefore =
        queryClient.getQueryState(petKeys.signedUrl('pet-1'))?.dataUpdatedAt ?? 0;
      const petVetsUpdatedAtBefore =
        queryClient.getQueryState(vetKeys.petVets('pet-1'))?.dataUpdatedAt ?? 0;

      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateVeterinarian(),
        { queryClient }
      );

      await mutationResult.current.mutateAsync({
        vetId: 'vet-1',
        vetData: { phone: '555-9999' },
      });

      // Sibling under ['pets'] refetched...
      await waitFor(() => {
        const petVetsUpdatedAtAfter =
          queryClient.getQueryState(vetKeys.petVets('pet-1'))?.dataUpdatedAt ?? 0;
        expect(petVetsUpdatedAtAfter).toBeGreaterThan(petVetsUpdatedAtBefore);
      });

      // ...while the signed URL was left untouched
      const signedUrlUpdatedAtAfter =
        queryClient.getQueryState(petKeys.signedUrl('pet-1'))?.dataUpdatedAt ?? 0;
      expect(signedUrlUpdatedAtAfter).toBe(signedUrlUpdatedAtBefore);
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

      await Promise.all([
        createResult.current.mutateAsync({
          vetData: buildVetFormData({ vetName: 'Dr. Concurrent' }),
        }),
        updateResult.current.mutateAsync({
          vetId: 'vet-1',
          vetData: { phone: '555-0002' },
        }),
      ]);

      // End-state assertion: list settles with both changes applied
      await waitFor(() => {
        expect(vetsQueryResult.current.data).toHaveLength(3);
        expect(
          vetsQueryResult.current.data?.find((v) => v.vetName === 'Dr. Concurrent')
        ).toBeDefined();
        expect(
          vetsQueryResult.current.data?.find((v) => v.id === 'vet-1')?.phone
        ).toBe('555-0002');
      });
    });

    it('should handle empty string fields correctly', async () => {
      const { queryClient } = renderHookWithQuery(() => useVeterinarians());

      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateVeterinarian(),
        { queryClient }
      );

      const createdVet = await mutationResult.current.mutateAsync({
        vetData: buildVetFormData({ vetName: 'Dr. Minimal' }),
      });

      expect(createdVet.vetName).toBe('Dr. Minimal');
    });
  });
});