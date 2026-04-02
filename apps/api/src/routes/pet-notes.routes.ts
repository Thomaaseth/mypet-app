import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { PetNotesService } from '../services/pet-notes.service';
import { globalAuthHandler, type AuthenticatedRequest } from '@/middleware/auth.middleware';
import { respondWithSuccess, respondWithCreated } from '@/lib/json';
import { validateCreateNote, validateUpdateNote } from '../../../web/src/lib/validations/pet-notes';
import { BadRequestError } from '@/middleware/errors';

const router = Router({ mergeParams: true});

router.use(globalAuthHandler);

// GET /api/pets/:petId/notes
router.get('/', async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.authSession?.user.id;
        if (!userId) throw new BadRequestError('User session not found');

        const { petId } = req.params;
        if (!petId) throw new BadRequestError('Pet ID is required');

        const notes = await PetNotesService.getNotes(petId, userId)

        respondWithSuccess(res, { notes, total: notes.length }, `Retrieved ${notes.length} note(s)`)
    } catch (error) {
        next(error)
    }
});

// POST /api/pets/:petId/notes
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.authSession?.user.id;
        if (!userId) throw new BadRequestError('User session not found');
    
        const { petId } = req.params;
        if (!petId) throw new BadRequestError('Pet ID is required');

        const validation = validateCreateNote(req.body);
        if (!validation.success) {
            const firstError = validation.error.errors[0];
            throw new BadRequestError(`Validation error: ${firstError.message}`)
        }
        const note = await PetNotesService.createNote(petId, userId, validation.data);
        respondWithCreated(res, { note }, 'Note created successfully')
    } catch (error) {
        next(error)
    }
});

// PUT /api/pets/:petId/notes/:noteId
router.put('/:noteId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.authSession?.user.id;
        if (!userId) throw new BadRequestError('User session not found');
    
        const { petId, noteId } = req.params;
        if (!petId) throw new BadRequestError('Pet ID is required');
        if (!noteId) throw new BadRequestError('Note ID is required');

        const validation = validateUpdateNote(req.body)
        if (!validation.success) {
            const firstError = validation.error.errors[0];
            throw new BadRequestError(`Validation error: ${firstError.message}`)
        }
        const note = await PetNotesService.updateNote(petId, noteId, userId, validation.data)
        respondWithSuccess(res, { note }, 'Note updated successfully');
    } catch (error) {
        next(error)
    }
});

// DELETE /api/pets/:petId/notes/:noteId
router.delete('/:noteId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.authSession?.user.id;
        if (!userId) throw new BadRequestError('User session not found');

        const { petId, noteId } = req.params;
        if (!petId) throw new BadRequestError('Pet ID is required');
        if (!noteId) throw new BadRequestError('Note ID is required');

        await PetNotesService.deleteNote(petId, noteId, userId);

        respondWithSuccess(res, null, 'Note deleted successfully')
    } catch (error) {
        next(error)
    }
});

export default router;