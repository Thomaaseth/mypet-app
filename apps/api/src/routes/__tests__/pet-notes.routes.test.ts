import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../middleware/errors';
import { errorMiddleware } from '../../middleware';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const VALID_PET_ID = '22222222-2222-4222-8222-222222222222';
const VALID_NOTE_ID = '33333333-3333-4333-8333-333333333333';

let session: { user: { id: string }; session: Record<string, unknown> } | null;

// --- Per-file seam: the service (logic covered by pet-notes.service.test.ts, if present) ---
vi.mock('../../services/pet-notes.service', () => ({
  PetNotesService: {
    getNotes: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
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

import petNotesRouter from '../pet-notes.routes';
import { PetNotesService } from '../../services/pet-notes.service';

// mergeParams: read petId from the parent — mount with the param in the path.
const app = express();
app.use(express.json());
app.use('/api/pets/:petId/notes', petNotesRouter);
app.use(errorMiddleware);

const base = `/api/pets/${VALID_PET_ID}/notes`;

const fakeNote = {
  id: VALID_NOTE_ID,
  petId: VALID_PET_ID,
  content: 'Vaccination due next month',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
} as Awaited<ReturnType<typeof PetNotesService.createNote>>;

beforeEach(() => {
  vi.clearAllMocks();
  session = { user: { id: TEST_USER_ID }, session: {} };
});

describe('pet-notes routes — auth guard', () => {
  it('returns 401 when unauthenticated', async () => {
    session = null;
    const res = await request(app).get(base);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
    expect(PetNotesService.getNotes).not.toHaveBeenCalled();
  });
});

describe('GET /api/pets/:petId/notes', () => {
  it('returns 200 with { notes, total } scoped to pet + user', async () => {
    vi.mocked(PetNotesService.getNotes).mockResolvedValue([fakeNote]);
    const res = await request(app).get(base);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.notes[0].id).toBe(VALID_NOTE_ID);
    expect(PetNotesService.getNotes).toHaveBeenCalledWith(VALID_PET_ID, TEST_USER_ID);
  });
});

describe('POST /api/pets/:petId/notes', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).post(base).send({ content: 'A note', isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error/);
    expect(PetNotesService.createNote).not.toHaveBeenCalled();
  });

  it('returns 400 on empty content', async () => {
    const res = await request(app).post(base).send({ content: '' });
    expect(res.status).toBe(400);
    expect(PetNotesService.createNote).not.toHaveBeenCalled();
  });

  it('returns 201 with { note } and calls createNote(petId, userId, data)', async () => {
    vi.mocked(PetNotesService.createNote).mockResolvedValue(fakeNote);
    const res = await request(app).post(base).send({ content: 'Vaccination due next month' });
    expect(res.status).toBe(201);
    expect(res.body.data.note.id).toBe(VALID_NOTE_ID);
    expect(res.body.message).toBe('Note created successfully');
    expect(PetNotesService.createNote).toHaveBeenCalledWith(
      VALID_PET_ID, TEST_USER_ID, expect.objectContaining({ content: 'Vaccination due next month' }),
    );
  });
});

describe('PUT /api/pets/:petId/notes/:noteId', () => {
  it('returns 400 on an injected field (strict) and does not call the service', async () => {
    const res = await request(app).put(`${base}/${VALID_NOTE_ID}`).send({ content: 'Updated', isAdmin: true });
    expect(res.status).toBe(400);
    expect(PetNotesService.updateNote).not.toHaveBeenCalled();
  });

  it('returns 200 and calls updateNote(petId, noteId, userId, data)', async () => {
    vi.mocked(PetNotesService.updateNote).mockResolvedValue(fakeNote);
    const res = await request(app).put(`${base}/${VALID_NOTE_ID}`).send({ content: 'Updated note' });
    expect(res.status).toBe(200);
    expect(res.body.data.note.id).toBe(VALID_NOTE_ID);
    expect(PetNotesService.updateNote).toHaveBeenCalledWith(
      VALID_PET_ID, VALID_NOTE_ID, TEST_USER_ID, expect.objectContaining({ content: 'Updated note' }),
    );
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(PetNotesService.updateNote).mockRejectedValue(new NotFoundError('Note not found'));
    const res = await request(app).put(`${base}/${VALID_NOTE_ID}`).send({ content: 'Updated note' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Note not found' });
  });
});

describe('DELETE /api/pets/:petId/notes/:noteId', () => {
  it('returns 200 with data: null and calls deleteNote(petId, noteId, userId)', async () => {
    vi.mocked(PetNotesService.deleteNote).mockResolvedValue(undefined);
    const res = await request(app).delete(`${base}/${VALID_NOTE_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    expect(PetNotesService.deleteNote).toHaveBeenCalledWith(VALID_PET_ID, VALID_NOTE_ID, TEST_USER_ID);
  });

  it('maps NotFoundError to 404', async () => {
    vi.mocked(PetNotesService.deleteNote).mockRejectedValue(new NotFoundError('Note not found'));
    const res = await request(app).delete(`${base}/${VALID_NOTE_ID}`);
    expect(res.status).toBe(404);
  });
});