import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../middleware/errors';
import { errorMiddleware } from '../../middleware';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const VALID_APPT_ID = '22222222-2222-4222-8222-222222222222';
const VALID_PET_ID = '33333333-3333-4333-8333-333333333333';
const VALID_VET_ID = '44444444-4444-4444-8444-444444444444';

// --- Shared auth toggle (inline, per-file — no harness) ---
let session: { user: { id: string }; session: Record<string, unknown> } | null;

// --- Per-file seam: the service (logic covered by appointments.service.test.ts) ---
vi.mock('../../services/appointments.service', () => ({
  AppointmentsService: {
    getAppointments: vi.fn(),
    getLastVetForPet: vi.fn(),
    getAppointmentById: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    updateVisitNotes: vi.fn(),
    deleteAppointment: vi.fn(),
  },
}));


// --- Auth: inject a session (or 401) without pulling better-auth/env ---
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

// --- Rate limiting is Redis-backed in prod; pass through in tests ---
vi.mock('../../middleware/rate-limit', () => ({
  userRateLimit: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

import appointmentsRouter from '../appointments.routes';
import { AppointmentsService } from '../../services/appointments.service';

const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentsRouter);
app.use(errorMiddleware);

// A body that passes createAppointmentSchema (strict) cleanly.
const validApptBody = {
  petId: VALID_PET_ID,
  veterinarianId: VALID_VET_ID,
  appointmentDate: '2026-08-15',
  appointmentTime: '14:05',
  appointmentType: 'checkup',
  reasonForVisit: 'Annual checkup',
  visitNotes: '',
};

const fakeAppointment = {
  id: VALID_APPT_ID,
  userId: TEST_USER_ID,
  petId: VALID_PET_ID,
  veterinarianId: VALID_VET_ID,
  appointmentDate: '2026-08-15',
  appointmentTime: '14:05',
  appointmentType: 'checkup',
  reasonForVisit: 'Annual checkup',
  visitNotes: '',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
} as Awaited<ReturnType<typeof AppointmentsService.getAppointmentById>>;

beforeEach(() => {
  vi.clearAllMocks();
  session = { user: { id: TEST_USER_ID }, session: {} };
});

describe('appointments routes — auth guard', () => {
  it('returns 401 when unauthenticated', async () => {
    session = null;
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(AppointmentsService.getAppointments).not.toHaveBeenCalled();
  });
});

describe('GET /api/appointments', () => {
  it('defaults to the "upcoming" filter when none is given', async () => {
    vi.mocked(AppointmentsService.getAppointments).mockResolvedValue([fakeAppointment]);
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.appointments[0].id).toBe(VALID_APPT_ID);
    expect(AppointmentsService.getAppointments).toHaveBeenCalledWith(TEST_USER_ID, 'upcoming');
  });

  it('passes a valid "past" filter through to the service', async () => {
    vi.mocked(AppointmentsService.getAppointments).mockResolvedValue([]);
    const res = await request(app).get('/api/appointments?filter=past');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
    expect(AppointmentsService.getAppointments).toHaveBeenCalledWith(TEST_USER_ID, 'past');
  });

  it('returns 400 on an invalid filter and does not call the service', async () => {
    const res = await request(app).get('/api/appointments?filter=sideways');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Filter must be/);
    expect(AppointmentsService.getAppointments).not.toHaveBeenCalled();
  });
});

describe('GET /api/appointments/last-vet/:petId', () => {
  it('returns the last vet id when one exists', async () => {
    vi.mocked(AppointmentsService.getLastVetForPet).mockResolvedValue(VALID_VET_ID);
    const res = await request(app).get(`/api/appointments/last-vet/${VALID_PET_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.veterinarianId).toBe(VALID_VET_ID);
    expect(AppointmentsService.getLastVetForPet).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID);
  });

  it('returns 200 with veterinarianId: null when the pet has no prior appointments', async () => {
    vi.mocked(AppointmentsService.getLastVetForPet).mockResolvedValue(null);
    const res = await request(app).get(`/api/appointments/last-vet/${VALID_PET_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.veterinarianId).toBeNull();
  });
});

describe('GET /api/appointments/:id', () => {
  it('returns 200 with { appointment } on success', async () => {
    vi.mocked(AppointmentsService.getAppointmentById).mockResolvedValue(fakeAppointment);
    const res = await request(app).get(`/api/appointments/${VALID_APPT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.appointment.id).toBe(VALID_APPT_ID);
    expect(AppointmentsService.getAppointmentById).toHaveBeenCalledWith(VALID_APPT_ID, TEST_USER_ID);
  });

  it('maps a NotFoundError to 404', async () => {
    vi.mocked(AppointmentsService.getAppointmentById).mockRejectedValue(new NotFoundError('Appointment not found'));
    const res = await request(app).get(`/api/appointments/${VALID_APPT_ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Appointment not found' });
  });
});

describe('POST /api/appointments', () => {
  it('returns 400 and does not call the service when the body is invalid', async () => {
    const res = await request(app).post('/api/appointments').send({ ...validApptBody, appointmentTime: '14:07' }); // not a 5-min increment
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(AppointmentsService.createAppointment).not.toHaveBeenCalled();
  });

  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).post('/api/appointments').send({ ...validApptBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(AppointmentsService.createAppointment).not.toHaveBeenCalled();
  });

  it('returns 201 and calls createAppointment(data, userId)', async () => {
    vi.mocked(AppointmentsService.createAppointment).mockResolvedValue(fakeAppointment);
    const res = await request(app).post('/api/appointments').send(validApptBody);
    expect(res.status).toBe(201);
    expect(res.body.data.appointment.id).toBe(VALID_APPT_ID);
    expect(res.body.message).toBe('Appointment created successfully');
    expect(AppointmentsService.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({ petId: VALID_PET_ID, veterinarianId: VALID_VET_ID, appointmentType: 'checkup' }),
      TEST_USER_ID,
    );
  });
});

describe('PUT /api/appointments/:id', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).put(`/api/appointments/${VALID_APPT_ID}`).send({ ...validApptBody, isAdmin: true });
    expect(res.status).toBe(400);
    expect(AppointmentsService.updateAppointment).not.toHaveBeenCalled();
  });

  it('returns 200 and strips id before calling updateAppointment(id, data, userId)', async () => {
    vi.mocked(AppointmentsService.updateAppointment).mockResolvedValue(fakeAppointment);
    const res = await request(app).put(`/api/appointments/${VALID_APPT_ID}`).send(validApptBody);
    expect(res.status).toBe(200);
    expect(res.body.data.appointment.id).toBe(VALID_APPT_ID);
    expect(AppointmentsService.updateAppointment).toHaveBeenCalledWith(
      VALID_APPT_ID,
      expect.objectContaining({ petId: VALID_PET_ID, appointmentType: 'checkup' }),
      TEST_USER_ID,
    );
    // id (merged in only for validation) must not leak into the service payload
    const [, updatePayload] = vi.mocked(AppointmentsService.updateAppointment).mock.calls[0];
    expect(updatePayload).not.toHaveProperty('id');
  });

  it('maps a NotFoundError to 404', async () => {
    vi.mocked(AppointmentsService.updateAppointment).mockRejectedValue(new NotFoundError('Appointment not found'));
    const res = await request(app).put(`/api/appointments/${VALID_APPT_ID}`).send(validApptBody);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Appointment not found' });
  });
});

describe('PATCH /api/appointments/:id/notes', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).patch(`/api/appointments/${VALID_APPT_ID}/notes`).send({ visitNotes: 'ok', isAdmin: true });
    expect(res.status).toBe(400);
    expect(AppointmentsService.updateVisitNotes).not.toHaveBeenCalled();
  });

  it('returns 200 and calls updateVisitNotes(id, notes, userId)', async () => {
    vi.mocked(AppointmentsService.updateVisitNotes).mockResolvedValue(fakeAppointment);
    const res = await request(app).patch(`/api/appointments/${VALID_APPT_ID}/notes`).send({ visitNotes: 'Went well' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Visit notes updated successfully');
    expect(AppointmentsService.updateVisitNotes).toHaveBeenCalledWith(VALID_APPT_ID, 'Went well', TEST_USER_ID);
  });

  it('coerces omitted visitNotes to an empty string for the service', async () => {
    vi.mocked(AppointmentsService.updateVisitNotes).mockResolvedValue(fakeAppointment);
    const res = await request(app).patch(`/api/appointments/${VALID_APPT_ID}/notes`).send({});
    expect(res.status).toBe(200);
    expect(AppointmentsService.updateVisitNotes).toHaveBeenCalledWith(VALID_APPT_ID, '', TEST_USER_ID);
  });
});

describe('DELETE /api/appointments/:id', () => {
  it('returns 200 with data: null and calls deleteAppointment(id, userId)', async () => {
    vi.mocked(AppointmentsService.deleteAppointment).mockResolvedValue(undefined);
    const res = await request(app).delete(`/api/appointments/${VALID_APPT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    expect(res.body.message).toBe('Appointment deleted successfully');
    expect(AppointmentsService.deleteAppointment).toHaveBeenCalledWith(VALID_APPT_ID, TEST_USER_ID);
  });

  it('maps a NotFoundError to 404', async () => {
    vi.mocked(AppointmentsService.deleteAppointment).mockRejectedValue(new NotFoundError('Appointment not found'));
    const res = await request(app).delete(`/api/appointments/${VALID_APPT_ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Appointment not found' });
  });
});