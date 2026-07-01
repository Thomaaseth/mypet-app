import { Router, Response, NextFunction } from 'express';
import { UserPreferencesService } from '../services/user-preferences.service';
import { globalAuthHandler, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { userRateLimit } from '../middleware/rate-limit';
import { BadRequestError } from '../middleware/errors';
import { respondWithSuccess } from '../lib/json';
import { userPreferencesFormSchema } from '@/shared/validations/locale';

const router = Router();

// Apply auth middleware to all routes
router.use(globalAuthHandler, userRateLimit);

// GET /api/users/preferences
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const preferences = await UserPreferencesService.getUserPreferences(userId);

    respondWithSuccess(res, { preferences }, 'User preferences retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/preferences
router.put('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const validation = userPreferencesFormSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const preferences = await UserPreferencesService.upsertUserPreferences(
      userId,
      validation.data
    );

    respondWithSuccess(res, { preferences }, 'User preferences saved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;