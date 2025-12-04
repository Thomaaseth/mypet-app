
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
export const mockActiveDryFood: DryFoodEntry[] = [
  {
    id: 'dry-1',
    petId: 'pet-1',
    foodType: 'dry',
    brandName: 'Royal Canin',
    productName: 'Persian Adult',
    bagWeight: '2.0',
    bagWeightUnit: 'kg',
    dailyAmount: '100',
    dryDailyAmountUnit: 'grams',
    dateStarted: '2024-01-01',
    dateFinished: null,
    isActive: true,
    remainingDays: 15,
    remainingWeight: 1500,
    depletionDate: '2024-01-16',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    numberOfUnits: null,
    weightPerUnit: null,
    wetWeightUnit: null,
    wetDailyAmountUnit: null,
  },
  {
    id: 'dry-2',
    petId: 'pet-1',
    foodType: 'dry',
    brandName: 'Hills',
    productName: 'Science Diet',
    bagWeight: '3.0',
    bagWeightUnit: 'kg',
    dailyAmount: '120',
    dryDailyAmountUnit: 'grams',
    dateStarted: '2024-01-15',
    dateFinished: null,
    isActive: true,
    remainingDays: 5, // Low stock
    remainingWeight: 600,
    depletionDate: '2024-01-20',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    numberOfUnits: null,
    weightPerUnit: null,
    wetWeightUnit: null,
    wetDailyAmountUnit: null,
  },
];

export const mockFinishedDryFood: DryFoodEntry[] = [
  {
    id: 'dry-finished-1',
    petId: 'pet-1',
    foodType: 'dry',
    brandName: 'Purina',
    productName: 'Pro Plan',
    bagWeight: '2.5',
    bagWeightUnit: 'kg',
    dailyAmount: '123',
    dryDailyAmountUnit: 'grams',
    dateStarted: '2024-01-01',
    dateFinished: '2024-01-23',
    isActive: false,
    actualDaysElapsed: 22,
    actualDailyConsumption: 113.64,
    expectedDailyConsumption: 110,
    variancePercentage: 3.31,
    feedingStatus: 'normal',
    createdAt: '2023-12-01T00:00:00.000Z',
    updatedAt: '2023-12-23T00:00:00.000Z',
    numberOfUnits: null,
    weightPerUnit: null,
    wetWeightUnit: null,
    wetDailyAmountUnit: null,
  },
];

let activeDryFoodList = [...mockActiveDryFood];
let finishedDryFoodList = [...mockFinishedDryFood];

export function resetMockDryFood() {
  activeDryFoodList = [...mockActiveDryFood];
  finishedDryFoodList = [...mockFinishedDryFood];
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

// DRY FOOD HANDLERS
const dryFoodHandlers = [
  // GET /api/pets/:petId/food/dry - Get active dry food entries
  http.get(`${API_BASE_URL}/api/pets/:petId/food/dry`, ({ params }) => {
    const { petId } = params;
    
    console.log('🔵 MSW: Intercepted GET /pets/:petId/food/dry', { petId });

    const entries = activeDryFoodList.filter(entry => entry.petId === petId);

    return HttpResponse.json({
      success: true,
      data: {
        foodEntries: entries,
        total: entries.length,
      },
      message: `Retrieved ${entries.length} active dry food entries`,
    });
  }),

  // GET /api/pets/:petId/food/finished - Get finished dry food entries (with foodType filter)
  http.get(`${API_BASE_URL}/api/pets/:petId/food/finished`, ({ params, request }) => {
    const { petId } = params;
    const url = new URL(request.url);
    const foodType = url.searchParams.get('foodType');
    
    console.log('🔵 MSW: Intercepted GET /pets/:petId/food/finished', { petId, foodType });

    // Filter by foodType if specified
    let entries = finishedDryFoodList.filter(entry => entry.petId === petId);
    
    if (foodType === 'dry') {
      entries = entries.filter(entry => entry.foodType === 'dry');
    }

    return HttpResponse.json({
      success: true,
      data: {
        foodEntries: entries,
        total: entries.length,
      },
      message: `Retrieved ${entries.length} finished dry food entries`,
    });
  }),

  // POST /api/pets/:petId/food/dry - Create dry food entry
  http.post(`${API_BASE_URL}/api/pets/:petId/food/dry`, async ({ params, request }) => {
    const { petId } = params;
    const body = await request.json();
    
    console.log('🔵 MSW: Intercepted POST /pets/:petId/food/dry', { petId, body });

    const newEntry: DryFoodEntry = {
      id: `dry-${Date.now()}`,
      petId: petId as string,
      foodType: 'dry',
      dateFinished: null,
      isActive: true,
      remainingDays: 20,
      remainingWeight: 2000,
      depletionDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      numberOfUnits: null,
      weightPerUnit: null,
      wetWeightUnit: null,
      wetDailyAmountUnit: null,
      ...(body as Partial<DryFoodEntry>),
    } as DryFoodEntry;

    activeDryFoodList.push(newEntry);

    return HttpResponse.json(
      {
        success: true,
        data: { foodEntry: newEntry },
        message: 'Dry food entry created successfully',
      },
      { status: 201 }
    );
  }),

  // PUT /api/pets/:petId/food/dry/:foodId - Update dry food entry
  http.put(`${API_BASE_URL}/api/pets/:petId/food/dry/:foodId`, async ({ params, request }) => {
    const { petId, foodId } = params;
    const body = await request.json();
    
    console.log('🔵 MSW: Intercepted PUT /pets/:petId/food/dry/:foodId', { petId, foodId, body });

    const entryIndex = activeDryFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );

    if (entryIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Food entry not found',
        },
        { status: 404 }
      );
    }

    const updatedEntry = {
      ...activeDryFoodList[entryIndex],
      ...(body as Partial<DryFoodEntry>),
      updatedAt: new Date().toISOString(),
    };

    activeDryFoodList[entryIndex] = updatedEntry;

    return HttpResponse.json({
      success: true,
      data: { foodEntry: updatedEntry },
      message: 'Dry food entry updated successfully',
    });
  }),

  // DELETE /api/pets/:petId/food/:foodId - Delete dry food entry
  http.delete(`${API_BASE_URL}/api/pets/:petId/food/:foodId`, ({ params }) => {
    const { petId, foodId } = params;
    
    console.log('🔵 MSW: Intercepted DELETE /pets/:petId/food/:foodId', { petId, foodId });

    const activeIndex = activeDryFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );
    
    const finishedIndex = finishedDryFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );

    if (activeIndex === -1 && finishedIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Food entry not found',
        },
        { status: 404 }
      );
    }

    if (activeIndex !== -1) {
      activeDryFoodList.splice(activeIndex, 1);
    }
    
    if (finishedIndex !== -1) {
      finishedDryFoodList.splice(finishedIndex, 1);
    }

    return HttpResponse.json({
      success: true,
      message: 'Food entry deleted successfully',
    });
  }),

  // PATCH /api/pets/:petId/food/:foodId/finish - Mark food as finished
  http.patch(`${API_BASE_URL}/api/pets/:petId/food/:foodId/finish`, async ({ params }) => {
    const { petId, foodId } = params;
    
    console.log('🔵 MSW: Intercepted PATCH /pets/:petId/food/:foodId/finish', { petId, foodId });

    const entryIndex = activeDryFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );

    if (entryIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Food entry not found',
        },
        { status: 404 }
      );
    }

    const entry = activeDryFoodList[entryIndex];
    const finishedEntry: DryFoodEntry = {
      ...entry,
      dateFinished: new Date().toISOString().split('T')[0],
      isActive: false,
      actualDaysElapsed: 20,
      actualDailyConsumption: 100,
      expectedDailyConsumption: parseFloat(entry.dailyAmount),
      variancePercentage: 0,
      feedingStatus: 'normal',
      updatedAt: new Date().toISOString(),
    };

    // Move from active to finished
    activeDryFoodList.splice(entryIndex, 1);
    finishedDryFoodList.unshift(finishedEntry);

    return HttpResponse.json({
      success: true,
      data: { foodEntry: finishedEntry },
      message: 'Food entry marked as finished',
    });
  }),

  // PUT /api/pets/:petId/food/:foodId/finish-date - Update finish date
  http.put(`${API_BASE_URL}/api/pets/:petId/food/:foodId/finish-date`, async ({ params, request }) => {
    const { petId, foodId } = params;
    const body = await request.json();
    
    console.log('🔵 MSW: Intercepted PUT /pets/:petId/food/:foodId/finish-date', { petId, foodId, body });

    const entryIndex = finishedDryFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );

    if (entryIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Finished food entry not found',
        },
        { status: 404 }
      );
    }

    const entry = finishedDryFoodList[entryIndex];
    const newDateFinished = (body as { dateFinished: string }).dateFinished;
    
    // Calculate actualDaysElapsed dynamically
    const startDate = new Date(entry.dateStarted);
    const finishDate = new Date(newDateFinished);
    const actualDaysElapsed = Math.ceil((finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate consumption metrics
    const bagWeightGrams = parseFloat(entry.bagWeight) * (entry.bagWeightUnit === 'kg' ? 1000 : 453.592);
    const expectedDailyConsumption = parseFloat(entry.dailyAmount);
    const actualDailyConsumption = bagWeightGrams / actualDaysElapsed;
    const variancePercentage = ((actualDailyConsumption - expectedDailyConsumption) / expectedDailyConsumption) * 100;
    
    // Determine feeding status
    let feedingStatus: 'overfeeding' | 'slightly-over' | 'normal' | 'slightly-under' | 'underfeeding';
    if (variancePercentage > 10) feedingStatus = 'overfeeding';
    else if (variancePercentage > 5) feedingStatus = 'slightly-over';
    else if (variancePercentage < -10) feedingStatus = 'underfeeding';
    else if (variancePercentage < -5) feedingStatus = 'slightly-under';
    else feedingStatus = 'normal';

    const updatedEntry = {
      ...entry,
      dateFinished: newDateFinished,
      actualDaysElapsed,
      actualDailyConsumption: Math.round(actualDailyConsumption * 100) / 100,
      expectedDailyConsumption,
      variancePercentage: Math.round(variancePercentage * 100) / 100,
      feedingStatus,
      updatedAt: new Date().toISOString(),
    };

    finishedDryFoodList[entryIndex] = updatedEntry;

    return HttpResponse.json({
      success: true,
      data: { foodEntry: updatedEntry },
      message: 'Finish date updated successfully',
    });
  }),
];

// EXPORT ALL HANDLERS
export const handlers = [
  ...petsHandlers,
  ...weightsHandlers,
  ...weightTargetsHandlers,
  ...dryFoodHandlers,
  // add next handlers
];


