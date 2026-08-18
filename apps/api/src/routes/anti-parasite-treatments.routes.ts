import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { AntiParasiteTreatmentsService } from '../services/anti-parasite-treatments.service';
import { globalAuthHandler } from '../middleware/auth.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { userRateLimit } from '../middleware/rate-limit';
import { BadRequestError } from '../middleware/errors';
import { respondWithSuccess, respondWithCreated } from '../lib/json';
import {
  antiParasiteTreatmentFormSchema,
  updateAntiParasiteTreatmentSchema,
} from '@/shared/validations/anti-parasite-treatment';

// mergeParams so :petId from the parent pets router is visible here.
const router = Router({ mergeParams: true });

router.use(globalAuthHandler, userRateLimit);

// GET /api/pets/:petId/anti-parasite-treatments - list all for a pet
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId } = req.params;
    const userId = req.authSession?.user.id;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    const treatments = await AntiParasiteTreatmentsService.getTreatments(petId, userId);

    respondWithSuccess(
      res,
      { antiParasiteTreatments: treatments, total: treatments.length },
      `Retrieved ${treatments.length} anti-parasite treatments`,
    );
  } catch (error) {
    next(error);
  }
});

// GET /api/pets/:petId/anti-parasite-treatments/:treatmentId - single
router.get('/:treatmentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId, treatmentId } = req.params;
    const userId = req.authSession?.user.id;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }
    if (!petId || !treatmentId) {
      throw new BadRequestError('Pet ID and treatment ID are required');
    }

    const treatment = await AntiParasiteTreatmentsService.getTreatmentById(petId, treatmentId, userId);

    respondWithSuccess(res, { antiParasiteTreatment: treatment }, 'Anti-parasite treatment retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/pets/:petId/anti-parasite-treatments - create
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId } = req.params;
    const userId = req.authSession?.user.id;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    const validation = antiParasiteTreatmentFormSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const treatment = await AntiParasiteTreatmentsService.createTreatment(
      petId,
      userId,
      validation.data,
    );

    respondWithCreated(res, { antiParasiteTreatment: treatment }, 'Anti-parasite treatment created successfully');
  } catch (error) {
    next(error);
  }
});

// PUT /api/pets/:petId/anti-parasite-treatments/:treatmentId - update
router.put('/:treatmentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId, treatmentId } = req.params;
    const userId = req.authSession?.user.id;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }
    if (!petId || !treatmentId) {
      throw new BadRequestError('Pet ID and treatment ID are required');
    }

    const validation = updateAntiParasiteTreatmentSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const treatment = await AntiParasiteTreatmentsService.updateTreatment(
      petId,
      treatmentId,
      userId,
      validation.data,
    );

    respondWithSuccess(res, { antiParasiteTreatment: treatment }, 'Anti-parasite treatment updated successfully');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/pets/:petId/anti-parasite-treatments/:treatmentId - delete
router.delete('/:treatmentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId, treatmentId } = req.params;
    const userId = req.authSession?.user.id;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }
    if (!petId || !treatmentId) {
      throw new BadRequestError('Pet ID and treatment ID are required');
    }

    await AntiParasiteTreatmentsService.deleteTreatment(petId, treatmentId, userId);

    respondWithSuccess(res, null, 'Anti-parasite treatment deleted successfully');
  } catch (error) {
    next(error);
  }
});

export default router;