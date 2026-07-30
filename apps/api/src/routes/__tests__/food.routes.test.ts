import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../middleware/errors';
import { errorMiddleware } from '../../middleware';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const VALID_PET_ID = '22222222-2222-4222-8222-222222222222';
const VALID_FOOD_ID = '33333333-3333-4333-8333-333333333333';

let session: { user: { id: string }; session: Record<string, unknown> } | null;

// --- Per-file seam: the food service (logic covered by services/__tests__/food/*) ---
vi.mock('../../services/food', () => ({
  FoodService: {
    getDryFoodEntries: vi.fn(),
    getDryFoodEntryById: vi.fn(),
    createDryFoodEntry: vi.fn(),
    calculateDryFoodRemaining: vi.fn(),
    updateDryFoodEntry: vi.fn(),
    getWetFoodEntries: vi.fn(),
    getWetFoodEntryById: vi.fn(),
    createWetFoodEntry: vi.fn(),
    calculateWetFoodRemaining: vi.fn(),
    updateWetFoodEntry: vi.fn(),
    getFinishedFoodEntries: vi.fn(),
    getAllFoodEntries: vi.fn(),
    updateFinishDate: vi.fn(),
    markFoodAsFinished: vi.fn(),
    deleteFoodEntry: vi.fn(),
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

import foodRouter from '../food.routes';
import { FoodService } from '../../services/food';

const app = express();
app.use(express.json());
// Mounted at root because the routes carry their own /:petId/food/... paths
app.use('/api/pets', foodRouter);
app.use(errorMiddleware);

// Bodies that pass the strict schemas cleanly.
const validDryBody = { dailyAmount: '100', dateStarted: '2026-07-22', bagWeight: '2', bagWeightUnit: 'kg' };
const validWetBody = { dailyAmount: '100', dateStarted: '2026-07-22', numberOfUnits: '10', weightPerUnit: '85', wetFoodUnit: 'grams' };

// Loose fakes for service returns — the route just passes these through / spreads them.
const fakeDry = { id: VALID_FOOD_ID, foodType: 'dry' } as Awaited<ReturnType<typeof FoodService.getDryFoodEntryById>>;
const fakeWet = { id: VALID_FOOD_ID, foodType: 'wet' } as Awaited<ReturnType<typeof FoodService.getWetFoodEntryById>>;
const fakeCalc = { remainingDays: 10 } as Awaited<ReturnType<typeof FoodService.calculateDryFoodRemaining>>;

beforeEach(() => {
  vi.clearAllMocks();
  session = { user: { id: TEST_USER_ID }, session: {} };
});

describe('food routes — auth guard', () => {
  it('returns 401 when unauthenticated', async () => {
    session = null;
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food/dry`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(FoodService.getDryFoodEntries).not.toHaveBeenCalled();
  });
});

// ---------- DRY ----------
describe('GET /:petId/food/dry', () => {
  it('returns 200 with { foodEntries, total } scoped to pet + user', async () => {
    vi.mocked(FoodService.getDryFoodEntries).mockResolvedValue([fakeDry]);
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food/dry`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(FoodService.getDryFoodEntries).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID);
  });
});

describe('GET /:petId/food/dry/:foodId', () => {
  it('returns 200 with { foodEntry }', async () => {
    vi.mocked(FoodService.getDryFoodEntryById).mockResolvedValue(fakeDry);
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food/dry/${VALID_FOOD_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.foodEntry.id).toBe(VALID_FOOD_ID);
    expect(FoodService.getDryFoodEntryById).toHaveBeenCalledWith(VALID_PET_ID, VALID_FOOD_ID, TEST_USER_ID);
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(FoodService.getDryFoodEntryById).mockRejectedValue(new NotFoundError('Food entry not found'));
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food/dry/${VALID_FOOD_ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Food entry not found' });
  });
});

describe('POST /:petId/food/dry', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).post(`/api/pets/${VALID_PET_ID}/food/dry`).send({ ...validDryBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(FoodService.createDryFoodEntry).not.toHaveBeenCalled();
  });

  it('returns 400 on an invalid body', async () => {
    const res = await request(app).post(`/api/pets/${VALID_PET_ID}/food/dry`).send({ ...validDryBody, bagWeightUnit: 'stones' });
    expect(res.status).toBe(400);
    expect(FoodService.createDryFoodEntry).not.toHaveBeenCalled();
  });

  it('returns 201 with the enriched entry (raw + calculations) and calls create(petId, userId, data)', async () => {
    vi.mocked(FoodService.createDryFoodEntry).mockResolvedValue(fakeDry);
    vi.mocked(FoodService.calculateDryFoodRemaining).mockResolvedValue(fakeCalc);
    const res = await request(app).post(`/api/pets/${VALID_PET_ID}/food/dry`).send(validDryBody);
    expect(res.status).toBe(201);
    expect(res.body.data.foodEntry).toMatchObject({ id: VALID_FOOD_ID, remainingDays: 10 });
    expect(FoodService.createDryFoodEntry).toHaveBeenCalledWith(
      VALID_PET_ID, TEST_USER_ID, expect.objectContaining({ dailyAmount: '100', bagWeightUnit: 'kg' }),
    );
  });
});

describe('PUT /:petId/food/dry/:foodId', () => {
  it('returns 400 on an injected field (strict)', async () => {
    const res = await request(app).put(`/api/pets/${VALID_PET_ID}/food/dry/${VALID_FOOD_ID}`).send({ dailyAmount: '120', isAdmin: true });
    expect(res.status).toBe(400);
    expect(FoodService.updateDryFoodEntry).not.toHaveBeenCalled();
  });

  it('returns 200 and calls update(petId, foodId, userId, data)', async () => {
    vi.mocked(FoodService.updateDryFoodEntry).mockResolvedValue(fakeDry);
    const res = await request(app).put(`/api/pets/${VALID_PET_ID}/food/dry/${VALID_FOOD_ID}`).send({ dailyAmount: '120' });
    expect(res.status).toBe(200);
    expect(FoodService.updateDryFoodEntry).toHaveBeenCalledWith(
      VALID_PET_ID, VALID_FOOD_ID, TEST_USER_ID, expect.objectContaining({ dailyAmount: '120' }),
    );
  });
});

// ---------- WET ----------
describe('GET /:petId/food/wet', () => {
  it('returns 200 with { foodEntries, total }', async () => {
    vi.mocked(FoodService.getWetFoodEntries).mockResolvedValue([fakeWet]);
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food/wet`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(FoodService.getWetFoodEntries).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID);
  });
});

describe('GET /:petId/food/wet/:foodId', () => {
  it('returns 200 with { foodEntry }', async () => {
    vi.mocked(FoodService.getWetFoodEntryById).mockResolvedValue(fakeWet);
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food/wet/${VALID_FOOD_ID}`);
    expect(res.status).toBe(200);
    expect(FoodService.getWetFoodEntryById).toHaveBeenCalledWith(VALID_PET_ID, VALID_FOOD_ID, TEST_USER_ID);
  });
});

describe('POST /:petId/food/wet', () => {
  it('returns 400 on an injected field (strict)', async () => {
    const res = await request(app).post(`/api/pets/${VALID_PET_ID}/food/wet`).send({ ...validWetBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(FoodService.createWetFoodEntry).not.toHaveBeenCalled();
  });

  it('returns 201 with the enriched entry and calls create(petId, userId, data)', async () => {
    vi.mocked(FoodService.createWetFoodEntry).mockResolvedValue(fakeWet);
    vi.mocked(FoodService.calculateWetFoodRemaining).mockResolvedValue(fakeCalc);
    const res = await request(app).post(`/api/pets/${VALID_PET_ID}/food/wet`).send(validWetBody);
    expect(res.status).toBe(201);
    expect(res.body.data.foodEntry).toMatchObject({ id: VALID_FOOD_ID, remainingDays: 10 });
    expect(FoodService.createWetFoodEntry).toHaveBeenCalledWith(
      VALID_PET_ID, TEST_USER_ID, expect.objectContaining({ wetFoodUnit: 'grams' }),
    );
  });
});

describe('PUT /:petId/food/wet/:foodId', () => {
  it('returns 400 on an injected field (strict)', async () => {
    const res = await request(app).put(`/api/pets/${VALID_PET_ID}/food/wet/${VALID_FOOD_ID}`).send({ dailyAmount: '120', isAdmin: true });
    expect(res.status).toBe(400);
    expect(FoodService.updateWetFoodEntry).not.toHaveBeenCalled();
  });

  it('returns 200 and calls update(petId, foodId, userId, data)', async () => {
    vi.mocked(FoodService.updateWetFoodEntry).mockResolvedValue(fakeWet);
    const res = await request(app).put(`/api/pets/${VALID_PET_ID}/food/wet/${VALID_FOOD_ID}`).send({ dailyAmount: '120', wetFoodUnit: 'grams' });
    expect(res.status).toBe(200);
    expect(FoodService.updateWetFoodEntry).toHaveBeenCalledWith(
      VALID_PET_ID, VALID_FOOD_ID, TEST_USER_ID, expect.objectContaining({ dailyAmount: '120', wetFoodUnit: 'grams' }),
    );
  });

  it('returns 400 when dailyAmount is present without wetFoodUnit (superRefine)', async () => {
    const res = await request(app)
      .put(`/api/pets/${VALID_PET_ID}/food/wet/${VALID_FOOD_ID}`)
      .send({ dailyAmount: '120' });
    expect(res.status).toBe(400);
    expect(FoodService.updateWetFoodEntry).not.toHaveBeenCalled();
  });
});

// ---------- FINISHED / COMBINED / STATE ----------
describe('GET /:petId/food/finished', () => {
  it('returns 400 when foodType is missing', async () => {
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food/finished`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/foodType query parameter is required/);
    expect(FoodService.getFinishedFoodEntries).not.toHaveBeenCalled();
  });

  it('returns 400 when foodType is neither dry nor wet', async () => {
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food/finished?foodType=snacks`);
    expect(res.status).toBe(400);
    expect(FoodService.getFinishedFoodEntries).not.toHaveBeenCalled();
  });

  it('defaults limit to 50 and forwards a valid foodType', async () => {
    vi.mocked(FoodService.getFinishedFoodEntries).mockResolvedValue([]);
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food/finished?foodType=dry`);
    expect(res.status).toBe(200);
    expect(FoodService.getFinishedFoodEntries).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID, 'dry', 50);
  });

  it('parses an explicit limit', async () => {
    vi.mocked(FoodService.getFinishedFoodEntries).mockResolvedValue([]);
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food/finished?foodType=wet&limit=10`);
    expect(res.status).toBe(200);
    expect(FoodService.getFinishedFoodEntries).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID, 'wet', 10);
  });
});

describe('GET /:petId/food', () => {
  it('returns 200 with combined { foodEntries, total }', async () => {
    vi.mocked(FoodService.getAllFoodEntries).mockResolvedValue([fakeDry, fakeWet]);
    const res = await request(app).get(`/api/pets/${VALID_PET_ID}/food`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(FoodService.getAllFoodEntries).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID);
  });
});

describe('PUT /:petId/food/:foodId/finish-date', () => {
  it('returns 400 when dateFinished is missing', async () => {
    const res = await request(app).put(`/api/pets/${VALID_PET_ID}/food/${VALID_FOOD_ID}/finish-date`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/dateFinished is required/);
    expect(FoodService.updateFinishDate).not.toHaveBeenCalled();
  });

  it('returns 400 on an unparseable date', async () => {
    const res = await request(app).put(`/api/pets/${VALID_PET_ID}/food/${VALID_FOOD_ID}/finish-date`).send({ dateFinished: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid date format/);
    expect(FoodService.updateFinishDate).not.toHaveBeenCalled();
  });

  it('returns 200 and forwards a valid date', async () => {
    vi.mocked(FoodService.updateFinishDate).mockResolvedValue(fakeDry);
    const res = await request(app).put(`/api/pets/${VALID_PET_ID}/food/${VALID_FOOD_ID}/finish-date`).send({ dateFinished: '2026-07-30' });
    expect(res.status).toBe(200);
    expect(FoodService.updateFinishDate).toHaveBeenCalledWith(VALID_PET_ID, VALID_FOOD_ID, TEST_USER_ID, '2026-07-30');
  });
});

describe('PATCH /:petId/food/:foodId/finish', () => {
  it('returns 200 and calls markFoodAsFinished(petId, foodId, userId)', async () => {
    vi.mocked(FoodService.markFoodAsFinished).mockResolvedValue(fakeDry);
    const res = await request(app).patch(`/api/pets/${VALID_PET_ID}/food/${VALID_FOOD_ID}/finish`);
    expect(res.status).toBe(200);
    expect(FoodService.markFoodAsFinished).toHaveBeenCalledWith(VALID_PET_ID, VALID_FOOD_ID, TEST_USER_ID);
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(FoodService.markFoodAsFinished).mockRejectedValue(new NotFoundError('Food entry not found'));
    const res = await request(app).patch(`/api/pets/${VALID_PET_ID}/food/${VALID_FOOD_ID}/finish`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /:petId/food/:foodId', () => {
  it('returns 200 with { message, deletedId } in data and calls delete(petId, foodId, userId)', async () => {
    vi.mocked(FoodService.deleteFoodEntry).mockResolvedValue(undefined);
    const res = await request(app).delete(`/api/pets/${VALID_PET_ID}/food/${VALID_FOOD_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.deletedId).toBe(VALID_FOOD_ID);
    expect(FoodService.deleteFoodEntry).toHaveBeenCalledWith(VALID_PET_ID, VALID_FOOD_ID, TEST_USER_ID);
  });
});