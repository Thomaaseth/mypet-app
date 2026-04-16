import { Router, Response, NextFunction } from 'express';
import { WeightTargetsService } from '../services/weight-targets.service';
import { globalAuthHandler } from '../middleware/auth.middleware';
import { BadRequestError } from '../middleware/errors';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { respondWithSuccess } from '../lib/json';
import { weightTargetSchema } from '../../../web/src/lib/validations/weight';

const router = Router({ mergeParams: true }); // mergeParams to access petId from parent route

// Apply auth middleware to all routes
router.use(globalAuthHandler);

// GET /api/pets/:petId/weight-target - Get weight target for a pet
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

    const target = await WeightTargetsService.getWeightTarget(petId, userId);
    
    respondWithSuccess(res, { weightTarget: target }, 'Weight target retrieved successfully');

  } catch (error) {
    next(error);
  }
});

// PUT /api/pets/:petId/weight-target - Create or update weight target
router.put('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId } = req.params;
    const userId = req.authSession?.user.id;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    const validation = weightTargetSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const weightTarget = await WeightTargetsService.upsertWeightTarget(
      petId, 
      userId, 
      validation.data
    );
    
    respondWithSuccess(res, { weightTarget }, 'Weight target saved successfully');

  } catch (error) {
    next(error);
  }
});

// DELETE /api/pets/:petId/weight-target - Delete weight target
router.delete('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId } = req.params;
    const userId = req.authSession?.user.id;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    await WeightTargetsService.deleteWeightTarget(petId, userId);
    
    respondWithSuccess(res, null, 'Weight target deleted successfully');

  } catch (error) {
    next(error);
  }
});

export default router;