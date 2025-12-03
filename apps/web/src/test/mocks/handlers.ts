
import { http, HttpResponse } from 'msw';
import type { Pet } from '@/types/pet';
import type { WeightEntry } from '@/types/weights';
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';
import { getApiUrl } from '@/lib/env';
import type { WeightTarget } from '@/types/weight-targets';


// Get API base URL from environment
const API_BASE_URL = getApiUrl();


/**
 * DEFAULT MOCK DATA
 * Reusable across multiple handlers
 */
export const mockPets: Pet[] = [
  {
    id: 'pet-1',
    userId: 'user-1',
    name: 'Fluffy',
    animalType: 'cat',
    species: 'Persian',
    gender: 'female',
    birthDate: '2020-01-15',
    isNeutered: true,
    microchipNumber: '123456789',
    imageUrl: null,
    notes: 'Very fluffy',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'pet-2',
    userId: 'user-1',
    name: 'Max',
    animalType: 'dog',
    species: 'Golden Retriever',
    gender: 'male',
    birthDate: '2019-06-20',
    isNeutered: false,
    microchipNumber: null,
    imageUrl: null,
    notes: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export const mockWeightEntries: WeightEntry[] = [
  {
    id: 'weight-1',
    petId: 'pet-1',
    weight: '4.50',
    weightUnit: 'kg',
    date: '2024-01-15',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'weight-2',
    petId: 'pet-1',
    weight: '4.60',
    weightUnit: 'kg',
    date: '2024-02-15',
    createdAt: '2024-02-15T00:00:00.000Z',
    updatedAt: '2024-02-15T00:00:00.000Z',
  },
];

export const mockWeightTarget: WeightTarget = {
  id: 'target-1',
  petId: 'pet-1',
  minWeight: '4.0',
  maxWeight: '5.0',
  weightUnit: 'kg',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

let petsList = [...mockPets];
let currentWeightTarget: WeightTarget | null = { ...mockWeightTarget };

export function resetMockPets() {
  petsList = [...mockPets];
}

export function resetMockWeightTarget() {
  currentWeightTarget = { ...mockWeightTarget };
}

/**
 * REQUEST HANDLERS
 * Organized by domain (pets, weights, food)
 */

// PETS ENDPOINTS
const petsHandlers = [
  // GET /api/pets - Get all pets
  http.get(`${API_BASE_URL}/api/pets`, () => {
    console.log('🔵 MSW: Intercepted GET /pets');
    return HttpResponse.json({
      success: true,
      data: {
        pets: petsList,
        total: petsList.length,
      },
      message: `Retrieved ${petsList.length} pet(s)`,
    });
  }),

  // GET /api/pets/:id - Get pet by ID
  http.get(`${API_BASE_URL}/api/pets/:id`, ({ params }) => {
    const { id } = params;
    const pet = petsList.find((p) => p.id === id);

    if (!pet) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Pet not found',
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { pet },
      message: 'Pet retrieved successfully',
    });
  }),

  // POST /api/pets - Create pet
  http.post(`${API_BASE_URL}/api/pets`, async ({ request }) => {
    const body = await request.json();
    const newPet: Pet = {
      id: `pet-${Date.now()}`,
      userId: 'user-1',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(body as Partial<Pet>),
    } as Pet;
    
    petsList.push(newPet);

    return HttpResponse.json(
      {
        success: true,
        data: { pet: newPet },
        message: 'Pet created successfully',
      },
      { status: 201 }
    );
  }),

  // PUT /api/pets/:id - Update pet
  http.put(`${API_BASE_URL}/api/pets/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const petIndex = petsList.findIndex((p) => p.id === id);

    if (petIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Pet not found',
        },
        { status: 404 }
      );
    }

    const updatedPet = {
      ...petsList[petIndex],
      ...(body as Partial<Pet>),
      updatedAt: new Date().toISOString(),
    };

    // Update in mutable list
    petsList[petIndex] = updatedPet;

    return HttpResponse.json({
      success: true,
      data: { pet: updatedPet },
      message: 'Pet updated successfully',
    });
  }),

  // DELETE /api/pets/:id - Delete pet
  http.delete(`${API_BASE_URL}/api/pets/:id`, ({ params }) => {
    const { id } = params;
    const petIndex = petsList.findIndex((p) => p.id === id);

    if (petIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Pet not found',
        },
        { status: 404 }
      );
    }

    // Remove from mutable list
    petsList.splice(petIndex, 1);

    return HttpResponse.json({
      success: true,
      message: 'Pet deleted successfully',
    });
  }),

  // GET /api/pets/count - Get pet count
  http.get(`${API_BASE_URL}/api/pets/stats/count`, () => {
    return HttpResponse.json({
      success: true,
      data: { count: petsList.length },
    });
  }),
];

// WEIGHT ENTRIES ENDPOINTS
const weightsHandlers = [
  // GET /api/pets/:petId/weights - Get all weight entries
  http.get(`${API_BASE_URL}/api/pets/:petId/weights`, ({ params }) => {
    const { petId } = params;
    const entries = mockWeightEntries.filter((w) => w.petId === petId);

    return HttpResponse.json({
      success: true,
      data: {
        weightEntries: entries,
        total: entries.length,
        weightUnit: 'kg',
      },
    });
  }),

  // POST /api/pets/:petId/weights - Create weight entry
  http.post(`${API_BASE_URL}/api/pets/:petId/weights`, async ({ params, request }) => {
    const { petId } = params;
    const body = await request.json();

    const newEntry: WeightEntry = {
      id: `weight-${Date.now()}`,
      petId: petId as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(body as Partial<WeightEntry>),
    } as WeightEntry;

    return HttpResponse.json(
      {
        success: true,
        data: { weightEntry: newEntry },
        message: 'Weight entry created successfully',
      },
      { status: 201 }
    );
  }),

  // PUT /api/pets/:petId/weights/:weightId - Update weight entry
  http.put(`${API_BASE_URL}/api/pets/:petId/weights/:weightId`, async ({ params, request }) => {
    const { weightId } = params;
    const body = await request.json();
    const entry = mockWeightEntries.find((w) => w.id === weightId);

    if (!entry) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Weight entry not found',
        },
        { status: 404 }
      );
    }

    const updatedEntry = {
      ...entry,
      ...(body as Partial<WeightEntry>),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: { weightEntry: updatedEntry },
      message: 'Weight entry updated successfully',
    });
  }),

  // DELETE /api/pets/:petId/weights/:weightId - Delete weight entry
  http.delete(`${API_BASE_URL}/api/pets/:petId/weights/:weightId`, ({ params }) => {
    const { weightId } = params;
    const entry = mockWeightEntries.find((w) => w.id === weightId);

    if (!entry) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Weight entry not found',
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Weight entry deleted successfully',
    });
  }),
];

// WEIGHT TARGET HANDLERS
const weightTargetsHandlers = [
  // GET /api/pets/:petId/weight-target - Get weight target for a pet
  http.get(`${API_BASE_URL}/api/pets/:petId/weight-target`, ({ params }) => {
    const { petId } = params;
    
    console.log('🔵 MSW: Intercepted GET /pets/:petId/weight-target', { petId });

    // Return null if no target exists
    if (!currentWeightTarget || currentWeightTarget.petId !== petId) {
      return HttpResponse.json({
        success: true,
        data: {
          weightTarget: null,
        },
        message: 'No weight target found for this pet',
      });
    }

    return HttpResponse.json({
      success: true,
      data: {
        weightTarget: currentWeightTarget,
      },
      message: 'Weight target retrieved successfully',
    });
  }),

  // PUT /api/pets/:petId/weight-target - Upsert weight target
  http.put(`${API_BASE_URL}/api/pets/:petId/weight-target`, async ({ params, request }) => {
    const { petId } = params;
    const body = await request.json();
    
    console.log('🔵 MSW: Intercepted PUT /pets/:petId/weight-target', { petId, body });

    // Simulate creating or updating target
    const upsertedTarget: WeightTarget = {
      id: currentWeightTarget?.id || `target-${Date.now()}`,
      petId: petId as string,
      createdAt: currentWeightTarget?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(body as Partial<WeightTarget>),
    } as WeightTarget;

    currentWeightTarget = upsertedTarget;

    return HttpResponse.json({
      success: true,
      data: {
        weightTarget: upsertedTarget,
      },
      message: 'Weight target saved successfully',
    });
  }),

  // DELETE /api/pets/:petId/weight-target - Delete weight target
  http.delete(`${API_BASE_URL}/api/pets/:petId/weight-target`, ({ params }) => {
    const { petId } = params;
    
    console.log('🔵 MSW: Intercepted DELETE /pets/:petId/weight-target', { petId });

    // Check if target exists
    if (!currentWeightTarget || currentWeightTarget.petId !== petId) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Weight target not found',
        },
        { status: 404 }
      );
    }

    // Delete the target
    currentWeightTarget = null;

    return HttpResponse.json({
      success: true,
      message: 'Weight target deleted successfully',
    });
  }),
];

// EXPORT ALL HANDLERS
export const handlers = [
  ...petsHandlers,
  ...weightsHandlers,
  ...weightTargetsHandlers,
  // add next handlers
];


