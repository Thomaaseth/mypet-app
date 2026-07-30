import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorMiddleware } from '../../middleware';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';

// Controls what auth.api.getSession returns (enrichment, not a gate).
let sessionResult: { user: { id: string } } | null;
let getSessionImpl: () => Promise<unknown>;

// --- Service seam ---
vi.mock('../../services/cookie-consent.service', () => ({
  CookieConsentService: { logConsent: vi.fn() },
}));

// --- better-auth: this route calls auth.api.getSession directly ---
vi.mock('../../lib/auth', () => ({
  auth: { api: { getSession: () => getSessionImpl() } },
}));

// fromNodeHeaders is called on req.headers; make it a no-op passthrough.
vi.mock('better-auth/node', () => ({ fromNodeHeaders: (h: unknown) => h }));

import cookieConsentRouter from '../cookie-consent.routes';
import { CookieConsentService } from '../../services/cookie-consent.service';

const app = express();
app.use(express.json());
app.use('/api/cookie-consent', cookieConsentRouter);
app.use(errorMiddleware);

const base = '/api/cookie-consent';

// Passes cookieConsentLogSchema (strict). choices is strict too (nested).
const validBody = {
  consentId: '22222222-2222-4222-8222-222222222222',
  choices: { necessary: true, analytics: true },
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionResult = { user: { id: TEST_USER_ID } };
  getSessionImpl = async () => sessionResult;
});

describe('POST /api/cookie-consent — validation', () => {
  it('returns 400 on an injected top-level field (strict)', async () => {
    const res = await request(app).post(base).send({ ...validBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(CookieConsentService.logConsent).not.toHaveBeenCalled();
  });

  it('returns 400 on an injected nested choices field (choices is strict)', async () => {
    const res = await request(app).post(base).send({
      ...validBody,
      choices: { necessary: true, analytics: true, tracking: true },
    });
    expect(res.status).toBe(400);
    expect(CookieConsentService.logConsent).not.toHaveBeenCalled();
  });

  it('returns 400 when necessary is not literally true', async () => {
    const res = await request(app).post(base).send({
      ...validBody,
      choices: { necessary: false, analytics: true },
    });
    expect(res.status).toBe(400);
    expect(CookieConsentService.logConsent).not.toHaveBeenCalled();
  });
});

describe('POST /api/cookie-consent — logging + session enrichment', () => {
  it('logs consent with userId when a session is present', async () => {
    vi.mocked(CookieConsentService.logConsent).mockResolvedValue(undefined);
    const res = await request(app).post(base).send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cookie consent logged successfully');
    expect(CookieConsentService.logConsent).toHaveBeenCalledWith(
      expect.objectContaining({ consentId: validBody.consentId }),
      expect.objectContaining({ userId: TEST_USER_ID }),
    );
  });

  it('logs anonymously (userId: null) when there is no session — no auth required', async () => {
    sessionResult = null;
    vi.mocked(CookieConsentService.logConsent).mockResolvedValue(undefined);
    const res = await request(app).post(base).send(validBody);
    expect(res.status).toBe(200);
    expect(CookieConsentService.logConsent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: null }),
    );
  });

  it('still logs (fail-open) when the session lookup throws', async () => {
    getSessionImpl = async () => { throw new Error('auth backend down'); };
    vi.mocked(CookieConsentService.logConsent).mockResolvedValue(undefined);
    const res = await request(app).post(base).send(validBody);
    expect(res.status).toBe(200);
    expect(CookieConsentService.logConsent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: null }),
    );
  });

  it('forwards request metadata (ipAddress, userAgent) to the service', async () => {
    vi.mocked(CookieConsentService.logConsent).mockResolvedValue(undefined);
    const res = await request(app).post(base).set('user-agent', 'vitest-agent').send(validBody);
    expect(res.status).toBe(200);
    const [, meta] = vi.mocked(CookieConsentService.logConsent).mock.calls[0];
    expect(meta).toMatchObject({ userAgent: 'vitest-agent' });
    expect(meta).toHaveProperty('ipAddress'); // value depends on trust-proxy; presence is the contract
  });
});