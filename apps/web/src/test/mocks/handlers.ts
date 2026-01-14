
import { http, HttpResponse } from 'msw';
import type { Pet } from '@/types/pet';
import type { WeightEntry } from '@/types/weights';
import type { DryFoodEntry, WetFoodEntry } from '@/types/food';
import { getApiUrl } from '@/lib/env';
import type { WeightTarget } from '@/types/weight-targets';
import type { Veterinarian } from '@/types/veterinarian';
import type { AppointmentWithRelations, AppointmentFormData } from '@/types/appointments';



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



// MOCK VETS
export const mockVeterinarians: Veterinarian[] = [
  {
    id: 'vet-1',
    userId: 'user-1',
    vetName: 'Dr. Sarah Johnson',
    clinicName: 'City Vet Clinic',
    phone: '555-1234',
    email: 'sjohnson@cityvet.com',
    website: 'www.cityvet.com',
    addressLine1: '123 Main Street',
    addressLine2: 'Suite 100',
    city: 'Boston',
    zipCode: '02101',
    notes: 'Emergency services available',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'vet-2',
    userId: 'user-1',
    vetName: 'Dr. Michael Chen',
    clinicName: 'Pet Care Hospital',
    phone: '555-5678',
    email: 'mchen@petcare.com',
    website: 'www.petcare.com',
    addressLine1: '456 Oak Avenue',
    addressLine2: null,
    city: 'Cambridge',
    zipCode: '02138',
    notes: null,
    isActive: true,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  },
];

let veterinariansList = [...mockVeterinarians];

export function resetMockVeterinarians() {
  veterinariansList = [...mockVeterinarians];
}

// Generate dynamic dates for mock appointments
const today = new Date();
const thirtyDaysFromNow = new Date(today);
thirtyDaysFromNow.setDate(today.getDate() + 30);
const sixtyDaysFromNow = new Date(today);
sixtyDaysFromNow.setDate(today.getDate() + 60);
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30)

export const mockUpcomingAppointments: AppointmentWithRelations[] = [
  {
    id: 'appt-1',
    petId: 'pet-1',
    veterinarianId: 'vet-1',
    appointmentDate: thirtyDaysFromNow.toISOString().split('T')[0],
    appointmentTime: '10:00:00',
    appointmentType: 'checkup',
    reasonForVisit: 'Annual checkup',
    visitNotes: null,
    userId: 'user-1',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
    pet: mockPets[0], // Reuse existing mockPets
    veterinarian: mockVeterinarians[0], // Reuse existing mockVeterinarians
  },
  {
    id: 'appt-2',
    petId: 'pet-2',
    veterinarianId: 'vet-2',
    appointmentDate: sixtyDaysFromNow.toISOString().split('T')[0],
    appointmentTime: '14:30:00',
    appointmentType: 'vaccination',
    reasonForVisit: 'Booster shots',
    visitNotes: null,
    userId: 'user-1',
    createdAt: '2025-01-16T00:00:00.000Z',
    updatedAt: '2025-01-16T00:00:00.000Z',
    pet: mockPets[1], // Reuse existing mockPets
    veterinarian: mockVeterinarians[1], // Reuse existing mockVeterinarians
  },
];

export const mockPastAppointments: AppointmentWithRelations[] = [
  {
    id: 'appt-past-1',
    petId: 'pet-1',
    veterinarianId: 'vet-1',
    appointmentDate: thirtyDaysAgo.toISOString().split('T')[0],
    appointmentTime: '11:00:00',
    appointmentType: 'checkup',
    reasonForVisit: 'Regular checkup',
    visitNotes: 'Checkup went well',
    userId: 'user-1',
    createdAt: '2024-12-01T00:00:00.000Z',
    updatedAt: '2024-12-15T00:00:00.000Z',
    pet: mockPets[0], // Reuse existing mockPets
    veterinarian: mockVeterinarians[0], // Reuse existing mockVeterinarians
  },
];


let upcomingAppointmentsList = [...mockUpcomingAppointments];
let pastAppointmentsList = [...mockPastAppointments];

export function resetMockAppointments() {
  upcomingAppointmentsList = [...mockUpcomingAppointments];
  pastAppointmentsList = [...mockPastAppointments];
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

export const mockActiveWetFood: WetFoodEntry[] = [
  {
    id: 'wet-1',
    petId: 'pet-1',
    foodType: 'wet',
    brandName: 'Fancy Feast',
    productName: 'Classic Pate',
    numberOfUnits: 12,
    weightPerUnit: '85',
    wetWeightUnit: 'grams',
    dailyAmount: '170',
    wetDailyAmountUnit: 'grams',
    dateStarted: '2024-01-01',
    dateFinished: null,
    isActive: true,
    remainingDays: 4,
    remainingWeight: 680,
    depletionDate: '2024-01-05',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    bagWeight: null,
    bagWeightUnit: null,
    dryDailyAmountUnit: null,
  },
  {
    id: 'wet-2',
    petId: 'pet-1',
    foodType: 'wet',
    brandName: 'Sheba',
    productName: 'Perfect Portions',
    numberOfUnits: 24,
    weightPerUnit: '37.5',
    wetWeightUnit: 'grams',
    dailyAmount: '150',
    wetDailyAmountUnit: 'grams',
    dateStarted: '2024-01-15',
    dateFinished: null,
    isActive: true,
    remainingDays: 6,
    remainingWeight: 900,
    depletionDate: '2024-01-21',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    bagWeight: null,
    bagWeightUnit: null,
    dryDailyAmountUnit: null,
  },
];

export const mockFinishedWetFood: WetFoodEntry[] = [
  {
    id: 'wet-finished-1',
    petId: 'pet-1',
    foodType: 'wet',
    brandName: 'Whiskas',
    productName: 'Pouch',
    numberOfUnits: 12,
    weightPerUnit: '85',
    wetWeightUnit: 'grams',
    dailyAmount: '50', // Adjusted: 1020g / 19 days = 53.68 g/day, variance = 7.36% → slightly-over
    wetDailyAmountUnit: 'grams',
    dateStarted: '2024-01-01',
    dateFinished: '2024-01-23',
    isActive: false,
    actualDaysElapsed: 22,
    actualDailyConsumption: 46.36,
    expectedDailyConsumption: 50,
    variancePercentage: -7.28,
    feedingStatus: 'slightly-under',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-23T00:00:00.000Z',
    bagWeight: null,
    bagWeightUnit: null,
    dryDailyAmountUnit: null,
  },
];

let activeWetFoodList = [...mockActiveWetFood];
let finishedWetFoodList = [...mockFinishedWetFood];

export function resetMockWetFood() {
  activeWetFoodList = [...mockActiveWetFood];
  finishedWetFoodList = [...mockFinishedWetFood];
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
  
    // Check dry food
    const dryActiveIndex = activeDryFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );
    const dryFinishedIndex = finishedDryFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );
  
    // Check wet food
    const wetActiveIndex = activeWetFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );
    const wetFinishedIndex = finishedWetFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );
  
    // If not found in any list
    if (dryActiveIndex === -1 && dryFinishedIndex === -1 && 
        wetActiveIndex === -1 && wetFinishedIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Food entry not found',
        },
        { status: 404 }
      );
    }
  
    // Delete from appropriate list
    if (dryActiveIndex !== -1) activeDryFoodList.splice(dryActiveIndex, 1);
    if (dryFinishedIndex !== -1) finishedDryFoodList.splice(dryFinishedIndex, 1);
    if (wetActiveIndex !== -1) activeWetFoodList.splice(wetActiveIndex, 1);
    if (wetFinishedIndex !== -1) finishedWetFoodList.splice(wetFinishedIndex, 1);
  
    return HttpResponse.json({
      success: true,
      message: 'Food entry deleted successfully',
    });
  }),

  // PATCH /api/pets/:petId/food/:foodId/finish - Mark food as finished
  http.patch(`${API_BASE_URL}/api/pets/:petId/food/:foodId/finish`, async ({ params }) => {
    const { petId, foodId } = params;
    
    console.log('🔵 MSW: Intercepted PATCH /pets/:petId/food/:foodId/finish', { petId, foodId });
  
    // Check dry food first
    const dryEntryIndex = activeDryFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );
  
    if (dryEntryIndex !== -1) {
      const entry = activeDryFoodList[dryEntryIndex];
      const finishedEntry = {
        ...entry,
        dateFinished: new Date().toISOString().split('T')[0],
        isActive: false,
        actualDaysElapsed: 20,
        actualDailyConsumption: 100,
        expectedDailyConsumption: parseFloat(entry.dailyAmount),
        variancePercentage: 0,
        feedingStatus: 'normal' as const,
        updatedAt: new Date().toISOString(),
      };
  
      activeDryFoodList.splice(dryEntryIndex, 1);
      finishedDryFoodList.unshift(finishedEntry);
  
      return HttpResponse.json({
        success: true,
        data: { foodEntry: finishedEntry },
        message: 'Food entry marked as finished',
      });
    }
  
    // Check wet food
    const wetEntryIndex = activeWetFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );
  
    if (wetEntryIndex !== -1) {
      const entry = activeWetFoodList[wetEntryIndex];
      const finishedEntry = {
        ...entry,
        dateFinished: new Date().toISOString().split('T')[0],
        isActive: false,
        actualDaysElapsed: 6,
        actualDailyConsumption: 170,
        expectedDailyConsumption: parseFloat(entry.dailyAmount),
        variancePercentage: 0,
        feedingStatus: 'normal' as const,
        updatedAt: new Date().toISOString(),
      };
  
      activeWetFoodList.splice(wetEntryIndex, 1);
      finishedWetFoodList.unshift(finishedEntry);
  
      return HttpResponse.json({
        success: true,
        data: { foodEntry: finishedEntry },
        message: 'Food entry marked as finished',
      });
    }
  
    return HttpResponse.json(
      {
        success: false,
        error: 'Food entry not found',
      },
      { status: 404 }
    );
  }),

  // PUT /api/pets/:petId/food/:foodId/finish-date - Update finish date
  http.put(`${API_BASE_URL}/api/pets/:petId/food/:foodId/finish-date`, async ({ params, request }) => {
    const { petId, foodId } = params;
    const body = await request.json();
    
    console.log('🔵 MSW: Intercepted PUT /pets/:petId/food/:foodId/finish-date', { petId, foodId, body });
  
    // Check dry food first
    const dryEntryIndex = finishedDryFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );
  
    if (dryEntryIndex !== -1) {
      const entry = finishedDryFoodList[dryEntryIndex];
      const newDateFinished = (body as { dateFinished: string }).dateFinished;
      
      const startDate = new Date(entry.dateStarted);
      const finishDate = new Date(newDateFinished);
      const actualDaysElapsed = Math.ceil((finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const bagWeightGrams = parseFloat(entry.bagWeight) * (entry.bagWeightUnit === 'kg' ? 1000 : 453.592);
      const expectedDailyConsumption = parseFloat(entry.dailyAmount);
      const actualDailyConsumption = bagWeightGrams / actualDaysElapsed;
      const variancePercentage = ((actualDailyConsumption - expectedDailyConsumption) / expectedDailyConsumption) * 100;
      
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
  
      finishedDryFoodList[dryEntryIndex] = updatedEntry;
  
      return HttpResponse.json({
        success: true,
        data: { foodEntry: updatedEntry },
        message: 'Finish date updated successfully',
      });
    }
  
    // Check wet food
    const wetEntryIndex = finishedWetFoodList.findIndex(
      entry => entry.id === foodId && entry.petId === petId
    );
  
    if (wetEntryIndex !== -1) {
      const entry = finishedWetFoodList[wetEntryIndex];
      const newDateFinished = (body as { dateFinished: string }).dateFinished;
      
      const startDate = new Date(entry.dateStarted);
      const finishDate = new Date(newDateFinished);
      const actualDaysElapsed = Math.ceil((finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const totalWeightGrams = entry.numberOfUnits * parseFloat(entry.weightPerUnit);
      const expectedDailyConsumption = parseFloat(entry.dailyAmount);
      const actualDailyConsumption = totalWeightGrams / actualDaysElapsed;
      const variancePercentage = ((actualDailyConsumption - expectedDailyConsumption) / expectedDailyConsumption) * 100;
      
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
  
      finishedWetFoodList[wetEntryIndex] = updatedEntry;
  
      return HttpResponse.json({
        success: true,
        data: { foodEntry: updatedEntry },
        message: 'Finish date updated successfully',
      });
    }
  
    return HttpResponse.json(
      {
        success: false,
        error: 'Finished food entry not found',
      },
      { status: 404 }
    );
  }),
];

const wetFoodHandlers = [
  // GET /api/pets/:petId/food/wet - Get active wet food entries
  http.get(`${API_BASE_URL}/api/pets/:petId/food/wet`, ({ params }) => {
    const { petId } = params;
    
    console.log('🔵 MSW: Intercepted GET /pets/:petId/food/wet', { petId });

    const entries = activeWetFoodList.filter(entry => entry.petId === petId);

    return HttpResponse.json({
      success: true,
      data: {
        foodEntries: entries,
        total: entries.length,
      },
      message: `Retrieved ${entries.length} active wet food entries`,
    });
  }),

  // GET /api/pets/:petId/food/finished - Get finished wet food entries (with foodType filter)
  http.get(`${API_BASE_URL}/api/pets/:petId/food/finished`, ({ params, request }) => {
    const { petId } = params;
    const url = new URL(request.url);
    const foodType = url.searchParams.get('foodType');
    
    console.log('🔵 MSW: Intercepted GET /pets/:petId/food/finished', { petId, foodType });

    let entries = finishedWetFoodList.filter(entry => entry.petId === petId);
    
    if (foodType === 'wet') {
      entries = entries.filter(entry => entry.foodType === 'wet');
    }

    return HttpResponse.json({
      success: true,
      data: {
        foodEntries: entries,
        total: entries.length,
      },
      message: `Retrieved ${entries.length} finished wet food entries`,
    });
  }),

  // POST /api/pets/:petId/food/wet - Create wet food entry
  http.post(`${API_BASE_URL}/api/pets/:petId/food/wet`, async ({ params, request }) => {
    const { petId } = params;
    const body = await request.json();
    
    console.log('🔵 MSW: Intercepted POST /pets/:petId/food/wet', { petId, body });

    const newEntry: WetFoodEntry = {
      id: `wet-${Date.now()}`,
      petId: petId as string,
      foodType: 'wet',
      dateFinished: null,
      isActive: true,
      remainingDays: 6,
      remainingWeight: 1020,
      depletionDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bagWeight: null,
      bagWeightUnit: null,
      dryDailyAmountUnit: null,
      ...(body as Partial<WetFoodEntry>),
    } as WetFoodEntry;

    activeWetFoodList.push(newEntry);

    return HttpResponse.json(
      {
        success: true,
        data: { foodEntry: newEntry },
        message: 'Wet food entry created successfully',
      },
      { status: 201 }
    );
  }),

  // PUT /api/pets/:petId/food/wet/:foodId - Update wet food entry
  http.put(`${API_BASE_URL}/api/pets/:petId/food/wet/:foodId`, async ({ params, request }) => {
    const { petId, foodId } = params;
    const body = await request.json();
    
    console.log('🔵 MSW: Intercepted PUT /pets/:petId/food/wet/:foodId', { petId, foodId, body });

    const entryIndex = activeWetFoodList.findIndex(
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
      ...activeWetFoodList[entryIndex],
      ...(body as Partial<WetFoodEntry>),
      updatedAt: new Date().toISOString(),
    };

    activeWetFoodList[entryIndex] = updatedEntry;

    return HttpResponse.json({
      success: true,
      data: { foodEntry: updatedEntry },
      message: 'Wet food entry updated successfully',
    });
  }),

  // DELETE PATCH PUT
  // Note: These handler are already defined in dryFoodHandlers
];

// VETS HANDLERS
const veterinariansHandlers = [
  // GET /api/vets - Get all veterinarians
  http.get(`${API_BASE_URL}/api/vets`, () => {
    console.log('🔵 MSW: Intercepted GET /vets');
    return HttpResponse.json({
      success: true,
      data: {
        veterinarians: veterinariansList,
        total: veterinariansList.length,
      },
      message: `Retrieved ${veterinariansList.length} veterinarian(s)`,
    });
  }),

  // GET /api/vets/:id - Get veterinarian by ID
  http.get(`${API_BASE_URL}/api/vets/:id`, ({ params }) => {
    const { id } = params;
    console.log('🔵 MSW: Intercepted GET /vets/:id', { id });
    
    const vet = veterinariansList.find((v) => v.id === id);

    if (!vet) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Veterinarian not found',
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { veterinarian: vet },
      message: 'Veterinarian retrieved successfully',
    });
  }),

  // POST /api/vets - Create veterinarian
  http.post(`${API_BASE_URL}/api/vets`, async ({ request }) => {
    const body = await request.json();
    console.log('🔵 MSW: Intercepted POST /vets', body);
    
    const newVet: Veterinarian = {
      id: `vet-${Date.now()}`,
      userId: 'user-1',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(body as Partial<Veterinarian>),
    } as Veterinarian;

    veterinariansList.push(newVet);

    return HttpResponse.json(
      {
        success: true,
        data: { veterinarian: newVet },
        message: 'Veterinarian created successfully',
      },
      { status: 201 }
    );
  }),

  // PUT /api/vets/:id - Update veterinarian
  http.put(`${API_BASE_URL}/api/vets/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    console.log('🔵 MSW: Intercepted PUT /vets/:id', { id, body });
    
    const vetIndex = veterinariansList.findIndex((v) => v.id === id);

    if (vetIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Veterinarian not found',
        },
        { status: 404 }
      );
    }

    const updatedVet = {
      ...veterinariansList[vetIndex],
      ...(body as Partial<Veterinarian>),
      updatedAt: new Date().toISOString(),
    };

    veterinariansList[vetIndex] = updatedVet;

    return HttpResponse.json({
      success: true,
      data: { veterinarian: updatedVet },
      message: 'Veterinarian updated successfully',
    });
  }),

  // DELETE /api/vets/:id - Delete veterinarian
  http.delete(`${API_BASE_URL}/api/vets/:id`, ({ params }) => {
    const { id } = params;
    console.log('🔵 MSW: Intercepted DELETE /vets/:id', { id });
    
    const vetIndex = veterinariansList.findIndex((v) => v.id === id);

    if (vetIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Veterinarian not found',
        },
        { status: 404 }
      );
    }

    veterinariansList.splice(vetIndex, 1);

    return HttpResponse.json({
      success: true,
      message: 'Veterinarian deleted successfully',
    });
  }),

  // POST /api/vets/:id/assign - Assign vet to pets
  http.post(`${API_BASE_URL}/api/vets/:id/assign`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    console.log('🔵 MSW: Intercepted POST /vets/:id/assign', { id, body });
    
    const vet = veterinariansList.find((v) => v.id === id);

    if (!vet) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Veterinarian not found',
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Pets assigned successfully',
    });
  }),

  // POST /api/vets/:id/unassign - Unassign vet from pets
  http.post(`${API_BASE_URL}/api/vets/:id/unassign`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    console.log('🔵 MSW: Intercepted POST /vets/:id/unassign', { id, body });
    
    const vet = veterinariansList.find((v) => v.id === id);

    if (!vet) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Veterinarian not found',
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Pets unassigned successfully',
    });
  }),

  // GET /api/vets/:id/pets - Get pets assigned to vet
  http.get(`${API_BASE_URL}/api/vets/:id/pets`, ({ params }) => {
    const { id } = params;
    console.log('🔵 MSW: Intercepted GET /vets/:id/pets', { id });
    
    const vet = veterinariansList.find((v) => v.id === id);

    if (!vet) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Veterinarian not found',
        },
        { status: 404 }
      );
    }

    // Mock: return pet-1 and pet-2 as assigned to vet-1
    const mockAssignments = id === 'vet-1' 
      ? [{ petId: 'pet-1' }, { petId: 'pet-2' }]
      : [];

    return HttpResponse.json({
      success: true,
      data: {
        pets: mockAssignments,
      },
      message: `Retrieved ${mockAssignments.length} assigned pet(s)`,
    });
  }),

  // GET /api/pets/:petId/vets - Get vets assigned to pet
  http.get(`${API_BASE_URL}/api/pets/:petId/vets`, ({ params }) => {
    const { petId } = params;
    console.log('🔵 MSW: Intercepted GET /pets/:petId/vets', { petId });
    
    // Mock: return vet-1 as assigned to pet-1
    const mockAssignedVets = petId === 'pet-1' 
      ? veterinariansList.filter(v => v.id === 'vet-1')
      : [];

    return HttpResponse.json({
      success: true,
      data: {
        veterinarians: mockAssignedVets,
        total: mockAssignedVets.length,
      },
      message: 'Retrieved veterinarians for pet',
    });
  }),
];

// Appointment HANDLERS
const appointmentsHandlers = [
  // GET /api/appointments - Get appointments with filter
  http.get(`${API_BASE_URL}/api/appointments`, ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'upcoming';
    
    console.log('🔵 MSW: Intercepted GET /api/appointments', { filter });

    const appointments = filter === 'past' ? pastAppointmentsList : upcomingAppointmentsList;

    return HttpResponse.json({
      success: true,
      data: {
        appointments,
        total: appointments.length,
      },
      message: `Retrieved ${appointments.length} ${filter} appointment(s)`,
    });
  }),

  // GET /api/appointments/:id - Get appointment by ID
  http.get(`${API_BASE_URL}/api/appointments/:id`, ({ params }) => {
    const { id } = params;
    console.log('🔵 MSW: Intercepted GET /api/appointments/:id', { id });
    
    // Search in both upcoming and past
    const appointment = 
      upcomingAppointmentsList.find((a) => a.id === id) ||
      pastAppointmentsList.find((a) => a.id === id);

    if (!appointment) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Appointment not found',
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { appointment },
      message: 'Appointment retrieved successfully',
    });
  }),

  // GET /api/pets/:petId/appointments/last-vet - Get last vet for pet
  http.get(`${API_BASE_URL}/api/appointments/last-vet/:petId`, ({ params }) => {
    const { petId } = params;
    console.log('🔵 MSW: Intercepted GET /api/appointments/last-vet/:petId', { petId });
    
    // Find most recent appointment for this pet
    const allAppointments = [...upcomingAppointmentsList, ...pastAppointmentsList];
    const petAppointments = allAppointments.filter(a => a.petId === petId);
    
    // Sort by date and time to get the most recent
    petAppointments.sort((a, b) => {
      const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
      if (dateCompare !== 0) return dateCompare;
      return b.appointmentTime.localeCompare(a.appointmentTime);
    });

    const veterinarianId = petAppointments.length > 0 ? petAppointments[0].veterinarianId : null;

    return HttpResponse.json({
      success: true,
      data: {
        veterinarianId,
      },
      message: veterinarianId 
        ? 'Last veterinarian retrieved successfully'
        : 'No appointments found for this pet',
    });
  }),

  // POST /api/appointments - Create appointment
  http.post(`${API_BASE_URL}/api/appointments`, async ({ request }) => {
    const body = (await request.json()) as AppointmentFormData;
    console.log('🔵 MSW: Intercepted POST /api/appointments', body);
    
    // Get the pet and vet from existing mocks
    const pet = petsList.find(p => p.id === body.petId) || mockPets[0];
    const vet = veterinariansList.find(v => v.id === body.veterinarianId) || mockVeterinarians[0];
    
    const newAppointment: AppointmentWithRelations = {
      id: `appt-${Date.now()}`,
      userId: 'user-1',
      petId: body.petId,
      veterinarianId: body.veterinarianId,
      appointmentDate: body.appointmentDate,
      // Add time seconds if not present
      appointmentTime: body.appointmentTime.length === 5 
        ? `${body.appointmentTime}:00` 
        : body.appointmentTime,
      appointmentType: body.appointmentType,
      reasonForVisit: body.reasonForVisit || null,
      visitNotes: body.visitNotes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pet,
      veterinarian: vet,
    };

    // Determine if upcoming or past based on date
    const today = new Date().toISOString().split('T')[0];

    if (newAppointment.appointmentDate >= today) {
      upcomingAppointmentsList.push(newAppointment);
    } else {
      pastAppointmentsList.push(newAppointment);
    }

    return HttpResponse.json(
      {
        success: true,
        data: { appointment: newAppointment },
        message: 'Appointment created successfully',
      },
      { status: 201 }
    );
  }),

  // PUT /api/appointments/:id - Update appointment
  http.put(`${API_BASE_URL}/api/appointments/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<AppointmentFormData>;
    console.log('🔵 MSW: Intercepted PUT /api/appointments/:id', { id, body });
    
    // Search in upcoming list
    const upcomingIndex = upcomingAppointmentsList.findIndex((a) => a.id === id);
    
    if (upcomingIndex !== -1) {
      const existing = upcomingAppointmentsList[upcomingIndex];
      const updatedAppointment: AppointmentWithRelations = {
        ...existing,
        ...(body.petId && { petId: body.petId }),
        ...(body.veterinarianId && { veterinarianId: body.veterinarianId }),
        ...(body.appointmentDate && { appointmentDate: body.appointmentDate }),
        ...(body.appointmentTime && { 
          appointmentTime: body.appointmentTime.length === 5 
            ? `${body.appointmentTime}:00` 
            : body.appointmentTime 
        }),
        ...(body.appointmentType && { appointmentType: body.appointmentType }),
        ...(body.reasonForVisit !== undefined && { reasonForVisit: body.reasonForVisit || null }),
        ...(body.visitNotes !== undefined && { visitNotes: body.visitNotes || null }),
        updatedAt: new Date().toISOString(),
      };

      upcomingAppointmentsList[upcomingIndex] = updatedAppointment;

      return HttpResponse.json({
        success: true,
        data: { appointment: updatedAppointment },
        message: 'Appointment updated successfully',
      });
    }

    // Search in past list
    const pastIndex = pastAppointmentsList.findIndex((a) => a.id === id);
    
    if (pastIndex !== -1) {
      const existing = pastAppointmentsList[pastIndex];
      const updatedAppointment: AppointmentWithRelations = {
        ...existing,
        ...(body.visitNotes !== undefined && { visitNotes: body.visitNotes || null }),
        updatedAt: new Date().toISOString(),
      };

      pastAppointmentsList[pastIndex] = updatedAppointment;

      return HttpResponse.json({
        success: true,
        data: { appointment: updatedAppointment },
        message: 'Appointment updated successfully',
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: 'Appointment not found',
      },
      { status: 404 }
    );
  }),

  // PATCH /api/appointments/:id/notes - Update visit notes
  http.patch(`${API_BASE_URL}/api/appointments/:id/notes`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { visitNotes: string };
    console.log('🔵 MSW: Intercepted PATCH /api/appointments/:id/notes', { id, body });
    
    // Usually only for past appointments
    const pastIndex = pastAppointmentsList.findIndex((a) => a.id === id);
    
    if (pastIndex !== -1) {
      const updatedAppointment: AppointmentWithRelations = {
        ...pastAppointmentsList[pastIndex],
        visitNotes: body.visitNotes,
        updatedAt: new Date().toISOString(),
      };

      pastAppointmentsList[pastIndex] = updatedAppointment;

      return HttpResponse.json({
        success: true,
        data: { appointment: updatedAppointment },
        message: 'Visit notes updated successfully',
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: 'Appointment not found',
      },
      { status: 404 }
    );
  }),

  // DELETE /api/appointments/:id - Delete appointment
  http.delete(`${API_BASE_URL}/api/appointments/:id`, ({ params }) => {
    const { id } = params;
    console.log('🔵 MSW: Intercepted DELETE /api/appointments/:id', { id });
    
    // Try to find and remove from upcoming
    const upcomingIndex = upcomingAppointmentsList.findIndex((a) => a.id === id);
    if (upcomingIndex !== -1) {
      upcomingAppointmentsList.splice(upcomingIndex, 1);

      return HttpResponse.json({
        success: true,
        message: 'Appointment deleted successfully',
      });
    }

    // Try to find and remove from past
    const pastIndex = pastAppointmentsList.findIndex((a) => a.id === id);
    if (pastIndex !== -1) {
      pastAppointmentsList.splice(pastIndex, 1);

      return HttpResponse.json({
        success: true,
        message: 'Appointment deleted successfully',
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: 'Appointment not found',
      },
      { status: 404 }
    );
  }),
];




// EXPORT ALL HANDLERS
export const handlers = [
  ...petsHandlers,
  ...weightsHandlers,
  ...weightTargetsHandlers,
  ...dryFoodHandlers,
  ...wetFoodHandlers,
  ...veterinariansHandlers,
  ...appointmentsHandlers,
];


