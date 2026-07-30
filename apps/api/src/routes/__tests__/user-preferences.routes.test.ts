import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorMiddleware } from '../../middleware';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';

let session: { user: { id: string }; session: Record<string, unknown> } | null;

// --- Per-file seam: the service (logic covered by user-preferences.service.test.ts) ---
vi.mock('../../services/user-preferences.service', () => ({
  UserPreferencesService: {
    getUserPreferences: vi.fn(),
    upsertUserPreferences: vi.fn(),
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

import userPreferencesRouter from '../user-preferences.routes';
import { UserPreferencesService } from '../../services/user-preferences.service';

const app = express();
app.use(express.json());
app.use('/api/users/preferences', userPreferencesRouter);
app.use(errorMiddleware);

const base = '/api/users/preferences';

// Passes userPreferencesFormSchema (strict) cleanly.
const validPrefsBody = { dateTimeLocale: 'fr-FR', unitSystem: 'metric', timezone: 'Europe/Paris' };

const fakePrefs = {
  id: '22222222-2222-4222-8222-222222222222',
  userId: TEST_USER_ID,
  dateTimeLocale: 'fr-FR',
  unitSystem: 'metric',
  timezone: 'Europe/Paris',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
} as Awaited<ReturnType<typeof UserPreferencesService.upsertUserPreferences>>;

beforeEach(() => {
  vi.clearAllMocks();
  session = { user: { id: TEST_USER_ID }, session: {} };
});

describe('user-preferences routes — auth guard', () => {
  it('returns 401 when unauthenticated', async () => {
    session = null;
    const res = await request(app).get(base);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(UserPreferencesService.getUserPreferences).not.toHaveBeenCalled();
  });
});

describe('GET /api/users/preferences', () => {
  it('returns 200 with { preferences } for the session user', async () => {
    vi.mocked(UserPreferencesService.getUserPreferences).mockResolvedValue(fakePrefs);
    const res = await request(app).get(base);
    expect(res.status).toBe(200);
    expect(res.body.data.preferences.userId).toBe(TEST_USER_ID);
    expect(UserPreferencesService.getUserPreferences).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('returns 200 with preferences: null when none are set', async () => {
    vi.mocked(UserPreferencesService.getUserPreferences).mockResolvedValue(null);
    const res = await request(app).get(base);
    expect(res.status).toBe(200);
    expect(res.body.data.preferences).toBeNull();
  });
});

describe('PUT /api/users/preferences', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).put(base).send({ ...validPrefsBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(UserPreferencesService.upsertUserPreferences).not.toHaveBeenCalled();
  });

  it('returns 400 on an unsupported locale', async () => {
    const res = await request(app).put(base).send({ ...validPrefsBody, dateTimeLocale: 'de-DE' });
    expect(res.status).toBe(400);
    expect(UserPreferencesService.upsertUserPreferences).not.toHaveBeenCalled();
  });

  it('returns 400 on an invalid timezone', async () => {
    const res = await request(app).put(base).send({ ...validPrefsBody, timezone: 'Mars/Phobos' });
    expect(res.status).toBe(400);
    expect(UserPreferencesService.upsertUserPreferences).not.toHaveBeenCalled();
  });

  it('returns 200 and calls upsertUserPreferences(userId, data)', async () => {
    vi.mocked(UserPreferencesService.upsertUserPreferences).mockResolvedValue(fakePrefs);
    const res = await request(app).put(base).send(validPrefsBody);
    expect(res.status).toBe(200);
    expect(res.body.data.preferences.userId).toBe(TEST_USER_ID);
    expect(res.body.message).toBe('User preferences saved successfully');
    expect(UserPreferencesService.upsertUserPreferences).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ dateTimeLocale: 'fr-FR', unitSystem: 'metric', timezone: 'Europe/Paris' }),
    );
  });
});