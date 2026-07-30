import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../middleware/errors';
import { errorMiddleware } from '../../middleware';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const VALID_PET_ID = '22222222-2222-4222-8222-222222222222';

let session: { user: { id: string }; session: Record<string, unknown> } | null;

// --- Per-file seam: the service (logic covered by weight-targets.service.test.ts) ---
vi.mock('../../services/weight-targets.service', () => ({
  WeightTargetsService: {
    getWeightTarget: vi.fn(),
    upsertWeightTarget: vi.fn(),
    deleteWeightTarget: vi.fn(),
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

import weightTargetsRouter from '../weight-targets.routes';
import { WeightTargetsService } from '../../services/weight-targets.service';

// mergeParams: read petId from the parent — mount with the param in the path.
const app = express();
app.use(express.json());
app.use('/api/pets/:petId/weight-target', weightTargetsRouter);
app.use(errorMiddleware);

const base = `/api/pets/${VALID_PET_ID}/weight-target`;

// Passes weightTargetSchema (strict, refine: min < max) cleanly.
const validTargetBody = { minWeight: '3', maxWeight: '6', weightUnit: 'kg' };

// Minimal fake — adjust to the real WeightTarget row if TS flags it.
const fakeTarget = {
  id: '33333333-3333-4333-8333-333333333333',
  petId: VALID_PET_ID,
  minWeight: '3.000',
  maxWeight: '6.000',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
} as Awaited<ReturnType<typeof WeightTargetsService.upsertWeightTarget>>;

beforeEach(() => {
  vi.clearAllMocks();
  session = { user: { id: TEST_USER_ID }, session: {} };
});

describe('weight-targets routes — auth guard', () => {
  it('returns 401 when unauthenticated', async () => {
    session = null;
    const res = await request(app).get(base);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(WeightTargetsService.getWeightTarget).not.toHaveBeenCalled();
  });
});

describe('GET /api/pets/:petId/weight-target', () => {
  it('returns 200 with { weightTarget } scoped to pet + user', async () => {
    vi.mocked(WeightTargetsService.getWeightTarget).mockResolvedValue(fakeTarget);
    const res = await request(app).get(base);
    expect(res.status).toBe(200);
    expect(res.body.data.weightTarget.petId).toBe(VALID_PET_ID);
    expect(WeightTargetsService.getWeightTarget).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID);
  });

  it('returns 200 with weightTarget: null when none is set', async () => {
    vi.mocked(WeightTargetsService.getWeightTarget).mockResolvedValue(null);
    const res = await request(app).get(base);
    expect(res.status).toBe(200);
    expect(res.body.data.weightTarget).toBeNull();
  });
});

describe('PUT /api/pets/:petId/weight-target', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).put(base).send({ ...validTargetBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(WeightTargetsService.upsertWeightTarget).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is invalid (min not < max)', async () => {
    const res = await request(app).put(base).send({ minWeight: '6', maxWeight: '3', weightUnit: 'kg' });
    expect(res.status).toBe(400);
    expect(WeightTargetsService.upsertWeightTarget).not.toHaveBeenCalled();
  });

  it('returns 200 and calls upsertWeightTarget(petId, userId, data)', async () => {
    vi.mocked(WeightTargetsService.upsertWeightTarget).mockResolvedValue(fakeTarget);
    const res = await request(app).put(base).send(validTargetBody);
    expect(res.status).toBe(200);
    expect(res.body.data.weightTarget.petId).toBe(VALID_PET_ID);
    expect(WeightTargetsService.upsertWeightTarget).toHaveBeenCalledWith(
      VALID_PET_ID, TEST_USER_ID, expect.objectContaining({ minWeight: '3', maxWeight: '6', weightUnit: 'kg' }),
    );
  });
});

describe('DELETE /api/pets/:petId/weight-target', () => {
  it('returns 200 with data: null and calls deleteWeightTarget(petId, userId)', async () => {
    vi.mocked(WeightTargetsService.deleteWeightTarget).mockResolvedValue(undefined);
    const res = await request(app).delete(base);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    expect(WeightTargetsService.deleteWeightTarget).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID);
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(WeightTargetsService.deleteWeightTarget).mockRejectedValue(new NotFoundError('Weight target not found'));
    const res = await request(app).delete(base);
    expect(res.status).toBe(404);
  });
});