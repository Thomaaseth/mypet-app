// apps/api/src/routes/__tests__/veterinarians.routes.test.ts
import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../middleware/errors';
import { errorMiddleware } from '../../middleware';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const VALID_VET_ID = '22222222-2222-4222-8222-222222222222';
const VALID_PET_ID = '33333333-3333-4333-8333-333333333333';

let session: { user: { id: string }; session: Record<string, unknown> } | null;

// --- Per-file seam: the service (logic covered by veterinarians.service.test.ts) ---
vi.mock('../../services/veterinarians.service', () => ({
  VeterinariansService: {
    getUserVeterinarians: vi.fn(),
    getVetPets: vi.fn(),
    getVeterinarianById: vi.fn(),
    createVeterinarian: vi.fn(),
    updateVeterinarian: vi.fn(),
    deleteVeterinarian: vi.fn(),
    assignVetToPets: vi.fn(),
    unassignVetFromPets: vi.fn(),
  },
}));

vi.mock('../../middleware/auth.middleware', () => ({
  globalAuthHandler: (req: Request, res: Response, next: NextFunction) => {
    if (!session) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    (req as Request & { authSession: typeof session }).authSession = session;
    next();
  },
}));

vi.mock('../../middleware/rate-limit', () => ({
  userRateLimit: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

import vetsRouter from '../veterinarians.routes';
import { VeterinariansService } from '../../services/veterinarians.service';

const app = express();
app.use(express.json());
app.use('/api/vets', vetsRouter);
app.use(errorMiddleware);

// Passes baseVeterinarianFormSchema (strict) cleanly. Required: vetName, phone, addressLine1, city, zipCode.
const validVetBody = {
  vetName: 'Dr. Jane Smith',
  phone: '555-123-4567',
  addressLine1: '123 Main St',
  city: 'Springfield',
  zipCode: '12345',
};

const fakeVet = {
  id: VALID_VET_ID,
  userId: TEST_USER_ID,
  vetName: 'Dr. Jane Smith',
  phone: '555-123-4567',
  addressLine1: '123 Main St',
  city: 'Springfield',
  zipCode: '12345',
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
} as Awaited<ReturnType<typeof VeterinariansService.getVeterinarianById>>;

beforeEach(() => {
  vi.clearAllMocks();
  session = { user: { id: TEST_USER_ID }, session: {} };
});

describe('vets routes — auth guard', () => {
  it('returns 401 when unauthenticated', async () => {
    session = null;
    const res = await request(app).get('/api/vets');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(VeterinariansService.getUserVeterinarians).not.toHaveBeenCalled();
  });
});

describe('GET /api/vets', () => {
  it('returns 200 with { veterinarians, total }', async () => {
    vi.mocked(VeterinariansService.getUserVeterinarians).mockResolvedValue([fakeVet]);
    const res = await request(app).get('/api/vets');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.veterinarians[0].id).toBe(VALID_VET_ID);
    expect(VeterinariansService.getUserVeterinarians).toHaveBeenCalledWith(TEST_USER_ID);
  });
});

describe('GET /api/vets/:id/pets', () => {
  it('returns 200 with { pets } and calls getVetPets(vetId, userId)', async () => {
    vi.mocked(VeterinariansService.getVetPets).mockResolvedValue([]);
    const res = await request(app).get(`/api/vets/${VALID_VET_ID}/pets`);
    expect(res.status).toBe(200);
    expect(res.body.data.pets).toEqual([]);
    expect(VeterinariansService.getVetPets).toHaveBeenCalledWith(VALID_VET_ID, TEST_USER_ID);
  });
});

describe('GET /api/vets/:id', () => {
  it('returns 200 with { veterinarian }', async () => {
    vi.mocked(VeterinariansService.getVeterinarianById).mockResolvedValue(fakeVet);
    const res = await request(app).get(`/api/vets/${VALID_VET_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.veterinarian.id).toBe(VALID_VET_ID);
    expect(VeterinariansService.getVeterinarianById).toHaveBeenCalledWith(VALID_VET_ID, TEST_USER_ID);
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(VeterinariansService.getVeterinarianById).mockRejectedValue(new NotFoundError('Veterinarian not found'));
    const res = await request(app).get(`/api/vets/${VALID_VET_ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Veterinarian not found' });
  });
});

describe('POST /api/vets', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).post('/api/vets').send({ ...validVetBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(VeterinariansService.createVeterinarian).not.toHaveBeenCalled();
  });

  it('returns 400 on an invalid body (missing required field)', async () => {
    const { vetName, ...missingName } = validVetBody;
    const res = await request(app).post('/api/vets').send(missingName);
    expect(res.status).toBe(400);
    expect(VeterinariansService.createVeterinarian).not.toHaveBeenCalled();
  });

  it('returns 201 and calls createVeterinarian({ ...vet, userId }, petIds)', async () => {
    vi.mocked(VeterinariansService.createVeterinarian).mockResolvedValue(fakeVet);
    const res = await request(app).post('/api/vets').send({ ...validVetBody, petIds: [VALID_PET_ID] });
    expect(res.status).toBe(201);
    expect(res.body.data.veterinarian.id).toBe(VALID_VET_ID);
    expect(VeterinariansService.createVeterinarian).toHaveBeenCalledWith(
      expect.objectContaining({ vetName: 'Dr. Jane Smith', userId: TEST_USER_ID }),
      [VALID_PET_ID],
    );
  });

  it('returns 400 when petIds contains a non-uuid (now validated, not raw)', async () => {
    const res = await request(app).post('/api/vets').send({ ...validVetBody, petIds: ['not-a-uuid'] });
    expect(res.status).toBe(400);
    expect(VeterinariansService.createVeterinarian).not.toHaveBeenCalled();
  });

  it('passes petIds as undefined when none are provided', async () => {
    vi.mocked(VeterinariansService.createVeterinarian).mockResolvedValue(fakeVet);
    const res = await request(app).post('/api/vets').send(validVetBody);
    expect(res.status).toBe(201);
    expect(VeterinariansService.createVeterinarian).toHaveBeenCalledWith(
      expect.objectContaining({ userId: TEST_USER_ID }),
      undefined,
    );
  });
});

describe('PUT /api/vets/:id', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).put(`/api/vets/${VALID_VET_ID}`).send({ ...validVetBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(VeterinariansService.updateVeterinarian).not.toHaveBeenCalled();
  });

  it('returns 200 and strips id before calling updateVeterinarian(vetId, userId, data)', async () => {
    vi.mocked(VeterinariansService.updateVeterinarian).mockResolvedValue(fakeVet);
    const res = await request(app).put(`/api/vets/${VALID_VET_ID}`).send({ ...validVetBody, vetName: 'Dr. New Name' });
    expect(res.status).toBe(200);
    expect(VeterinariansService.updateVeterinarian).toHaveBeenCalledWith(
      VALID_VET_ID, TEST_USER_ID, expect.objectContaining({ vetName: 'Dr. New Name' }),
    );
    const [, , updatePayload] = vi.mocked(VeterinariansService.updateVeterinarian).mock.calls[0];
    expect(updatePayload).not.toHaveProperty('id');
  });
});

describe('DELETE /api/vets/:id', () => {
  it('returns 200 with data: null and calls deleteVeterinarian(vetId, userId)', async () => {
    vi.mocked(VeterinariansService.deleteVeterinarian).mockResolvedValue(undefined);
    const res = await request(app).delete(`/api/vets/${VALID_VET_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    expect(VeterinariansService.deleteVeterinarian).toHaveBeenCalledWith(VALID_VET_ID, TEST_USER_ID);
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(VeterinariansService.deleteVeterinarian).mockRejectedValue(new NotFoundError('Veterinarian not found'));
    const res = await request(app).delete(`/api/vets/${VALID_VET_ID}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/vets/:id/assign', () => {
  it('returns 400 on an invalid assignment body (empty petIds)', async () => {
    const res = await request(app).post(`/api/vets/${VALID_VET_ID}/assign`).send({ petIds: [] });
    expect(res.status).toBe(400);
    expect(VeterinariansService.assignVetToPets).not.toHaveBeenCalled();
  });

  it('returns 400 on an injected field (strict)', async () => {
    const res = await request(app).post(`/api/vets/${VALID_VET_ID}/assign`).send({ petIds: [VALID_PET_ID], isAdmin: true });
    expect(res.status).toBe(400);
    expect(VeterinariansService.assignVetToPets).not.toHaveBeenCalled();
  });

  it('returns 200 and calls assignVetToPets(vetId, userId, petIds)', async () => {
    vi.mocked(VeterinariansService.assignVetToPets).mockResolvedValue(undefined);
    const res = await request(app).post(`/api/vets/${VALID_VET_ID}/assign`).send({ petIds: [VALID_PET_ID] });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    expect(VeterinariansService.assignVetToPets).toHaveBeenCalledWith(VALID_VET_ID, TEST_USER_ID, [VALID_PET_ID]);
  });
});

describe('POST /api/vets/:id/unassign', () => {
  it('returns 400 on an invalid assignment body (empty petIds)', async () => {
    const res = await request(app).post(`/api/vets/${VALID_VET_ID}/unassign`).send({ petIds: [] });
    expect(res.status).toBe(400);
    expect(VeterinariansService.unassignVetFromPets).not.toHaveBeenCalled();
  });

  it('returns 200 and calls unassignVetFromPets(vetId, userId, petIds)', async () => {
    vi.mocked(VeterinariansService.unassignVetFromPets).mockResolvedValue(undefined);
    const res = await request(app).post(`/api/vets/${VALID_VET_ID}/unassign`).send({ petIds: [VALID_PET_ID] });
    expect(res.status).toBe(200);
    expect(VeterinariansService.unassignVetFromPets).toHaveBeenCalledWith(VALID_VET_ID, TEST_USER_ID, [VALID_PET_ID]);
  });
});