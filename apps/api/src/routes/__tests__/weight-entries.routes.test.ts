import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../middleware/errors';
import { errorMiddleware } from '../../middleware';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const VALID_PET_ID = '22222222-2222-4222-8222-222222222222';
const VALID_WEIGHT_ID = '33333333-3333-4333-8333-333333333333';

let session: { user: { id: string }; session: Record<string, unknown> } | null;

// --- Per-file seam: the service (logic covered by weight.service.test.ts) ---
vi.mock('../../services/weight-entries.service', () => ({
  WeightEntriesService: {
    getWeightEntries: vi.fn(),
    getWeightEntryById: vi.fn(),
    createWeightEntry: vi.fn(),
    updateWeightEntry: vi.fn(),
    deleteWeightEntry: vi.fn(),
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

import weightRouter from '../weight-entries.routes';
import { WeightEntriesService } from '../../services/weight-entries.service';

// Router uses mergeParams to read petId from the parent — mount it the same way.
const app = express();
app.use(express.json());
app.use('/api/pets/:petId/weights', weightRouter);
app.use(errorMiddleware);

const base = `/api/pets/${VALID_PET_ID}/weights`;

// Passes weightEntryFormSchema (strict) cleanly.
const validWeightBody = { weight: '4.5', weightUnit: 'kg', date: '2026-07-22' };

const fakeEntry = {
  id: VALID_WEIGHT_ID,
  petId: VALID_PET_ID,
  weight: '4.500',
  date: '2026-07-22',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
} as Awaited<ReturnType<typeof WeightEntriesService.getWeightEntryById>>;
// getWeightEntries returns an object with a weightEntries array (route reads result.weightEntries)
const fakeList = { weightEntries: [fakeEntry] } as Awaited<ReturnType<typeof WeightEntriesService.getWeightEntries>>;

beforeEach(() => {
  vi.clearAllMocks();
  session = { user: { id: TEST_USER_ID }, session: {} };
});

describe('weight-entries routes — auth guard', () => {
  it('returns 401 when unauthenticated', async () => {
    session = null;
    const res = await request(app).get(base);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(WeightEntriesService.getWeightEntries).not.toHaveBeenCalled();
  });
});

describe('GET /api/pets/:petId/weights', () => {
  it('returns 200 with { weightEntries, total } scoped to pet + user', async () => {
    vi.mocked(WeightEntriesService.getWeightEntries).mockResolvedValue(fakeList);
    const res = await request(app).get(base);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.weightEntries[0].id).toBe(VALID_WEIGHT_ID);
    expect(WeightEntriesService.getWeightEntries).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID);
  });
});

describe('GET /api/pets/:petId/weights/:weightId', () => {
  it('returns 200 with { weightEntry }', async () => {
    vi.mocked(WeightEntriesService.getWeightEntryById).mockResolvedValue(fakeEntry);
    const res = await request(app).get(`${base}/${VALID_WEIGHT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.weightEntry.id).toBe(VALID_WEIGHT_ID);
    expect(WeightEntriesService.getWeightEntryById).toHaveBeenCalledWith(VALID_PET_ID, VALID_WEIGHT_ID, TEST_USER_ID);
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(WeightEntriesService.getWeightEntryById).mockRejectedValue(new NotFoundError('Weight entry not found'));
    const res = await request(app).get(`${base}/${VALID_WEIGHT_ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Weight entry not found' });
  });
});

describe('POST /api/pets/:petId/weights', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).post(base).send({ ...validWeightBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(WeightEntriesService.createWeightEntry).not.toHaveBeenCalled();
  });

  it('returns 400 on an invalid body (missing required field)', async () => {
    const res = await request(app).post(base).send({ weightUnit: 'kg', date: '2026-07-22' }); // no weight
    expect(res.status).toBe(400);
    expect(WeightEntriesService.createWeightEntry).not.toHaveBeenCalled();
  });

  it('returns 200 and calls createWeightEntry(petId, userId, data)', async () => {
    vi.mocked(WeightEntriesService.createWeightEntry).mockResolvedValue(fakeEntry);
    const res = await request(app).post(base).send(validWeightBody);
    expect(res.status).toBe(200); // note: route uses respondWithSuccess (200), not Created
    expect(res.body.data.weightEntry.id).toBe(VALID_WEIGHT_ID);
    expect(WeightEntriesService.createWeightEntry).toHaveBeenCalledWith(
      VALID_PET_ID, TEST_USER_ID, expect.objectContaining({ weight: '4.5', weightUnit: 'kg', date: '2026-07-22' }),
    );
  });
});

describe('PUT /api/pets/:petId/weights/:weightId', () => {
  it('returns 400 on an injected field (strict via .partial())', async () => {
    const res = await request(app).put(`${base}/${VALID_WEIGHT_ID}`).send({ weight: '5.0', isAdmin: true });
    expect(res.status).toBe(400);
    expect(WeightEntriesService.updateWeightEntry).not.toHaveBeenCalled();
  });

  it('returns 200 and calls updateWeightEntry(petId, weightId, userId, data)', async () => {
    vi.mocked(WeightEntriesService.updateWeightEntry).mockResolvedValue(fakeEntry);
    const res = await request(app).put(`${base}/${VALID_WEIGHT_ID}`).send({ weight: '5.0' });
    expect(res.status).toBe(200);
    expect(WeightEntriesService.updateWeightEntry).toHaveBeenCalledWith(
      VALID_PET_ID, VALID_WEIGHT_ID, TEST_USER_ID, expect.objectContaining({ weight: '5.0' }),
    );
  });

  it('accepts an empty partial body ({}) and forwards it', async () => {
    vi.mocked(WeightEntriesService.updateWeightEntry).mockResolvedValue(fakeEntry);
    const res = await request(app).put(`${base}/${VALID_WEIGHT_ID}`).send({});
    expect(res.status).toBe(200);
    expect(WeightEntriesService.updateWeightEntry).toHaveBeenCalledWith(VALID_PET_ID, VALID_WEIGHT_ID, TEST_USER_ID, {});
  });
});

describe('DELETE /api/pets/:petId/weights/:weightId', () => {
  it('returns 200 with data: null and calls deleteWeightEntry(petId, weightId, userId)', async () => {
    vi.mocked(WeightEntriesService.deleteWeightEntry).mockResolvedValue(undefined);
    const res = await request(app).delete(`${base}/${VALID_WEIGHT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    expect(WeightEntriesService.deleteWeightEntry).toHaveBeenCalledWith(VALID_PET_ID, VALID_WEIGHT_ID, TEST_USER_ID);
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(WeightEntriesService.deleteWeightEntry).mockRejectedValue(new NotFoundError('Weight entry not found'));
    const res = await request(app).delete(`${base}/${VALID_WEIGHT_ID}`);
    expect(res.status).toBe(404);
  });
});