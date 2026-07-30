// apps/api/src/routes/__tests__/pets.routes.test.ts
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { NotFoundError } from '../../middleware/errors';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const VALID_PET_ID = '22222222-2222-4222-8222-222222222222';

// Shared session toggle. vi.hoisted so the (hoisted) auth mock below and the
// tests reference the same mutable value. Route only reads `user.id`, so a
// minimal double is enough.
type TestSession = { user: { id: string }; session: Record<string, unknown> };
const authState = vi.hoisted(() => {
  let session: TestSession | null = null;
  return {
    set: (s: TestSession | null) => { session = s; },
    get: (): TestSession | null => session,
  };
});

// --- Seam 1: the service (its logic is covered by pets.service.test.ts) ---
vi.mock('../../services/pets.service', () => ({
  PetsService: {
    getUserPets: vi.fn(),
    getPetById: vi.fn(),
    createPet: vi.fn(),
    updatePet: vi.fn(),
    deletePet: vi.fn(),
    hardDeletePet: vi.fn(),
  },
}));

// --- Seam 2: auth — inject a session (or 401) without pulling better-auth/env ---
vi.mock('../../middleware/auth.middleware', () => ({
  globalAuthHandler: (req: Request, res: Response, next: NextFunction) => {
    const session = authState.get();
    if (!session) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    // Single localized cast: minimal test double, route reads only user.id.
    (req as AuthenticatedRequest).authSession = session as AuthenticatedRequest['authSession'];
    next();
  },
}));

// --- Seam 3: rate limiting is Redis-backed in prod; pass through in tests ---
vi.mock('../../middleware/rate-limit', () => ({
  userRateLimit: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// --- Defensive: keep the transitive graph off Postgres/Redis/env at import time.
//     Some of these may be unused once services/sub-routers are mocked; if vitest
//     flags an unmatched mock, delete that line. ---
vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/lib/redis', () => ({ redisClient: null }));
vi.mock('@/config', () => ({ config: { env: { webUrl: 'http://localhost:3000' } } }));
vi.mock('@/lib/upload', () => ({
  upload: { single: () => (_req: Request, _res: Response, next: NextFunction) => next() },
}));
vi.mock('@/services/storage.service', () => ({ StorageService: {} }));
vi.mock('@/services/veterinarians.service', () => ({ VeterinariansService: {} }));
vi.mock('@/middleware/csrf.middleware', () => ({
  csrfOriginGuard: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));
// Sub-routers pull their own service→db graphs; stub each to a bare Router.
vi.mock('../weight-entries.routes', async () => ({ default: (await import('express')).default.Router() }));
vi.mock('../weight-targets.routes', async () => ({ default: (await import('express')).default.Router() }));
vi.mock('../pet-notes.routes', async () => ({ default: (await import('express')).default.Router() }));

// Import AFTER mocks are registered.
import petsRouter from '../pets.routes';
import { PetsService } from '../../services/pets.service';
import { errorMiddleware } from '../../middleware';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/pets', petsRouter);
  app.use(errorMiddleware);
  return app;
}
const app = makeApp();

// A body that passes createPetSchema (strict) cleanly.
const validPetBody = {
  name: 'Whiskers',
  animalType: 'cat',
  species: 'Siamese',
  gender: 'female',
  birthDate: '2020-01-01',
  weight: '4.5',
  weightUnit: 'kg',
  isNeutered: true,
  microchipNumber: 'ABC123',
  notes: 'Friendly',
};

// Cast a fixture to the real Pet return type without importing the type by name.
const fakePet = {
  id: VALID_PET_ID,
  userId: TEST_USER_ID,
  name: 'Whiskers',
  animalType: 'cat',
  species: 'Siamese',
  gender: 'female',
  birthDate: '2020-01-01',
  isNeutered: true,
  microchipNumber: 'ABC123',
  notes: 'Friendly',
  imageUrl: null,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
} as Awaited<ReturnType<typeof PetsService.getPetById>>;

beforeEach(() => {
  vi.clearAllMocks();
  authState.set({ user: { id: TEST_USER_ID }, session: {} }); // authenticated by default
});

describe('pets routes — auth guard', () => {
  it('returns 401 when unauthenticated', async () => {
    authState.set(null);
    const res = await request(app).get('/api/pets');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(PetsService.getUserPets).not.toHaveBeenCalled();
  });
});

describe('GET /api/pets', () => {
  it('returns 200 with { pets, total } and calls the service with the userId', async () => {
    vi.mocked(PetsService.getUserPets).mockResolvedValue([fakePet]);
    const res = await request(app).get('/api/pets');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.pets).toHaveLength(1);
    expect(res.body.data.pets[0].id).toBe(VALID_PET_ID);
    expect(PetsService.getUserPets).toHaveBeenCalledWith(TEST_USER_ID);
  });
});

describe('GET /api/pets/:id', () => {
  it('returns 200 with { pet } on success', async () => {
    vi.mocked(PetsService.getPetById).mockResolvedValue(fakePet);
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.pet.id).toBe(VALID_PET_ID);
  });

  it('maps a NotFoundError from the service to 404', async () => {
    vi.mocked(PetsService.getPetById).mockRejectedValue(new NotFoundError('Pet not found'));
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Pet not found' });
  });
});

describe('POST /api/pets', () => {
  it('returns 400 and does not call the service when the body is invalid', async () => {
    const res = await request(app).post('/api/pets').send({ ...validPetBody, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(PetsService.createPet).not.toHaveBeenCalled();
  });

  it('returns 400 on an injected/unrecognized field (strict) and does not call the service', async () => {
    const res = await request(app).post('/api/pets').send({ ...validPetBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(PetsService.createPet).not.toHaveBeenCalled();
  });

  it('returns 201 with { pet } and calls createPet with the body + userId', async () => {
    vi.mocked(PetsService.createPet).mockResolvedValue(fakePet);
    const res = await request(app).post('/api/pets').send(validPetBody);
    expect(res.status).toBe(201);
    expect(res.body.data.pet.id).toBe(VALID_PET_ID);
    expect(res.body.message).toBe('Pet created successfully');
    expect(PetsService.createPet).toHaveBeenCalledTimes(1);
    expect(PetsService.createPet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Whiskers', animalType: 'cat', userId: TEST_USER_ID }),
    );
  });
});

describe('PUT /api/pets/:id', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app)
      .put(`/api/pets/${VALID_PET_ID}`)
      .send({ name: 'New Name', isAdmin: true });
    expect(res.status).toBe(400);
    expect(PetsService.updatePet).not.toHaveBeenCalled();
  });

  it('returns 200 and strips id before calling updatePet(petId, userId, data)', async () => {
    vi.mocked(PetsService.updatePet).mockResolvedValue(fakePet);
    const res = await request(app)
      .put(`/api/pets/${VALID_PET_ID}`)
      .send({ name: 'New Name', notes: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.pet.id).toBe(VALID_PET_ID);
    expect(PetsService.updatePet).toHaveBeenCalledWith(
      VALID_PET_ID,
      TEST_USER_ID,
      expect.objectContaining({ name: 'New Name', notes: 'Updated' }),
    );
    // id must not leak into the service payload (it's already in the URL)
    const [, , updatePayload] = vi.mocked(PetsService.updatePet).mock.calls[0];
    expect(updatePayload).not.toHaveProperty('id');
  });
});

describe('DELETE /api/pets/:id', () => {
  it('returns 200 with data: null and calls deletePet(petId, userId)', async () => {
    vi.mocked(PetsService.deletePet).mockResolvedValue(undefined);
    const res = await request(app).delete(`/api/pets/${VALID_PET_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    expect(res.body.message).toBe('Pet deleted successfully');
    expect(PetsService.deletePet).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID);
  });

  it('maps a NotFoundError to 404', async () => {
    vi.mocked(PetsService.deletePet).mockRejectedValue(new NotFoundError('Pet not found'));
    const res = await request(app).delete(`/api/pets/${VALID_PET_ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Pet not found' });
  });
});