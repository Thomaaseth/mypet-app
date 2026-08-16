import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError, BadRequestError } from '../../middleware/errors';
import { errorMiddleware } from '../../middleware';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const VALID_PET_ID = '22222222-2222-4222-8222-222222222222';
const VALID_TREATMENT_ID = '33333333-3333-4333-8333-333333333333';

let session: { user: { id: string }; session: Record<string, unknown> } | null;

// --- Per-file seam: the service (logic covered by anti-parasite.service.test.ts) ---
vi.mock('../../services/anti-parasite-treatments.service', () => ({
  AntiParasiteTreatmentsService: {
    getTreatments: vi.fn(),
    getTreatmentById: vi.fn(),
    createTreatment: vi.fn(),
    updateTreatment: vi.fn(),
    deleteTreatment: vi.fn(),
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

import antiParasiteRouter from '../anti-parasite-treatments.routes';
import { AntiParasiteTreatmentsService } from '../../services/anti-parasite-treatments.service';

// Router uses mergeParams to read petId from the parent — mount it the same way.
const app = express();
app.use(express.json());
app.use('/api/pets/:petId/anti-parasite-treatments', antiParasiteRouter);
app.use(errorMiddleware);

const base = `/api/pets/${VALID_PET_ID}/anti-parasite-treatments`;

// Passes antiParasiteTreatmentFormSchema (strict) cleanly.
const validBody = {
  productName: 'Bravecto',
  categories: ['fleas_ticks'],
  durationUnit: 'months',
  durationAmount: 3,
  dateAdministered: '2026-07-22',
};

const fakeTreatment = {
  id: VALID_TREATMENT_ID,
  petId: VALID_PET_ID,
  productName: 'Bravecto',
  durationUnit: 'months',
  durationAmount: 3,
  dateAdministered: '2026-07-22',
  categories: ['fleas_ticks'],
  expiryDate: '2026-10-22',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
} as Awaited<ReturnType<typeof AntiParasiteTreatmentsService.getTreatmentById>>;

beforeEach(() => {
  vi.clearAllMocks();
  session = { user: { id: TEST_USER_ID }, session: {} };
});

describe('anti-parasite routes — auth guard', () => {
  it('returns 401 when unauthenticated', async () => {
    session = null;
    const res = await request(app).get(base);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(AntiParasiteTreatmentsService.getTreatments).not.toHaveBeenCalled();
  });
});

describe('GET /api/pets/:petId/anti-parasite-treatments', () => {
  it('returns 200 with { antiParasiteTreatments, total } scoped to pet + user', async () => {
    vi.mocked(AntiParasiteTreatmentsService.getTreatments).mockResolvedValue([fakeTreatment]);
    const res = await request(app).get(base);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.antiParasiteTreatments[0].id).toBe(VALID_TREATMENT_ID);
    expect(AntiParasiteTreatmentsService.getTreatments).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID);
  });
});

describe('GET /api/pets/:petId/anti-parasite-treatments/:treatmentId', () => {
  it('returns 200 with { antiParasiteTreatment }', async () => {
    vi.mocked(AntiParasiteTreatmentsService.getTreatmentById).mockResolvedValue(fakeTreatment);
    const res = await request(app).get(`${base}/${VALID_TREATMENT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.antiParasiteTreatment.id).toBe(VALID_TREATMENT_ID);
    expect(AntiParasiteTreatmentsService.getTreatmentById).toHaveBeenCalledWith(
      VALID_PET_ID,
      VALID_TREATMENT_ID,
      TEST_USER_ID,
    );
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(AntiParasiteTreatmentsService.getTreatmentById).mockRejectedValue(
      new NotFoundError('Anti-parasite treatment not found'),
    );
    const res = await request(app).get(`${base}/${VALID_TREATMENT_ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Anti-parasite treatment not found' });
  });

  it('maps BadRequestError (bad UUID from service) to 400', async () => {
    vi.mocked(AntiParasiteTreatmentsService.getTreatmentById).mockRejectedValue(
      new BadRequestError('Invalid treatment ID format'),
    );
    const res = await request(app).get(`${base}/not-a-uuid`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/pets/:petId/anti-parasite-treatments', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).post(base).send({ ...validBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(AntiParasiteTreatmentsService.createTreatment).not.toHaveBeenCalled();
  });

  it('returns 400 when categories is empty (schema min 1)', async () => {
    const res = await request(app).post(base).send({ ...validBody, categories: [] });
    expect(res.status).toBe(400);
    expect(AntiParasiteTreatmentsService.createTreatment).not.toHaveBeenCalled();
  });

  it('returns 400 on an invalid duration combination (schema refine)', async () => {
    const res = await request(app).post(base).send({ ...validBody, durationUnit: 'months', durationAmount: 2 });
    expect(res.status).toBe(400);
    expect(AntiParasiteTreatmentsService.createTreatment).not.toHaveBeenCalled();
  });

  it('returns 201 and calls createTreatment(petId, userId, data)', async () => {
    vi.mocked(AntiParasiteTreatmentsService.createTreatment).mockResolvedValue(fakeTreatment);
    const res = await request(app).post(base).send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.data.antiParasiteTreatment.id).toBe(VALID_TREATMENT_ID);
    expect(AntiParasiteTreatmentsService.createTreatment).toHaveBeenCalledWith(
      VALID_PET_ID,
      TEST_USER_ID,
      expect.objectContaining({ productName: 'Bravecto', categories: ['fleas_ticks'] }),
    );
  });
});

describe('PUT /api/pets/:petId/anti-parasite-treatments/:treatmentId', () => {
  it('returns 400 on an injected field (strict via the update schema)', async () => {
    const res = await request(app).put(`${base}/${VALID_TREATMENT_ID}`).send({ productName: 'Nexgard', isAdmin: true });
    expect(res.status).toBe(400);
    expect(AntiParasiteTreatmentsService.updateTreatment).not.toHaveBeenCalled();
  });

  it('returns 400 when duration amount is sent without a unit (pairing rule)', async () => {
    const res = await request(app).put(`${base}/${VALID_TREATMENT_ID}`).send({ durationAmount: 3 });
    expect(res.status).toBe(400);
    expect(AntiParasiteTreatmentsService.updateTreatment).not.toHaveBeenCalled();
  });

  it('returns 200 and calls updateTreatment(petId, treatmentId, userId, data)', async () => {
    vi.mocked(AntiParasiteTreatmentsService.updateTreatment).mockResolvedValue(fakeTreatment);
    const res = await request(app).put(`${base}/${VALID_TREATMENT_ID}`).send({ productName: 'Nexgard' });
    expect(res.status).toBe(200);
    expect(res.body.data.antiParasiteTreatment.id).toBe(VALID_TREATMENT_ID);
    expect(AntiParasiteTreatmentsService.updateTreatment).toHaveBeenCalledWith(
      VALID_PET_ID,
      VALID_TREATMENT_ID,
      TEST_USER_ID,
      expect.objectContaining({ productName: 'Nexgard' }),
    );
  });
});

describe('DELETE /api/pets/:petId/anti-parasite-treatments/:treatmentId', () => {
  it('returns 200 and calls deleteTreatment(petId, treatmentId, userId)', async () => {
    vi.mocked(AntiParasiteTreatmentsService.deleteTreatment).mockResolvedValue(undefined);
    const res = await request(app).delete(`${base}/${VALID_TREATMENT_ID}`);
    expect(res.status).toBe(200);
    expect(AntiParasiteTreatmentsService.deleteTreatment).toHaveBeenCalledWith(
      VALID_PET_ID,
      VALID_TREATMENT_ID,
      TEST_USER_ID,
    );
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(AntiParasiteTreatmentsService.deleteTreatment).mockRejectedValue(
      new NotFoundError('Anti-parasite treatment not found'),
    );
    const res = await request(app).delete(`${base}/${VALID_TREATMENT_ID}`);
    expect(res.status).toBe(404);
  });
});