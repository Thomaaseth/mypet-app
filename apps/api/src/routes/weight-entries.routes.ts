import { Router, Response, NextFunction } from 'express';
import { WeightEntriesService } from '../services/weight-entries.service';
import { globalAuthHandler } from '../middleware/auth.middleware';
import { BadRequestError } from '../middleware/errors';
import { respondWithSuccess } from '../lib/json';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';


const router = Router({ mergeParams: true }); // mergeParams to access petId from parent route

// Apply auth middleware to all routes
router.use(globalAuthHandler);

// GET /api/pets/:petId/weights - Get all weight entries for a pet
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

    const result = await WeightEntriesService.getWeightEntries(petId, userId);

    
    respondWithSuccess(res, {
        weightEntries: result.weightEntries,
        total: result.weightEntries.length,
        weightUnit: result.weightUnit
    }, `Retrieved ${result.weightEntries.length} weight entries`)
  } catch (error) {
    next(error);
  }
});

// GET /api/pets/:petId/weights/:weightId - Get a specific weight entry
router.get('/:weightId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId, weightId } = req.params;
    const userId = req.authSession?.user.id;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    if (!petId || !weightId) {
      throw new BadRequestError('Pet ID and Weight ID are required');
    }

    const weightEntry = await WeightEntriesService.getWeightEntryById(petId, weightId, userId);
    
    respondWithSuccess(res, { weightEntry }, 'Weight entry retrieved successfully')
    } catch (error) {
    next(error);
  }
});

// POST /api/pets/:petId/weights - Create a new weight entry
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId } = req.params;
    const userId = req.authSession?.user.id;
    const { weight, date, weightUnit } = req.body;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    if (!weight || !date || !weightUnit) {
      throw new BadRequestError('Weight, unit and date are required');
    }

    const weightEntry = await WeightEntriesService.createWeightEntry(
      petId, 
      userId, 
      { weight, date, weightUnit }
    );
    
    respondWithSuccess(res, { weightEntry }, 'Weight entry updated successfully');
  } catch (error) {
    next(error);
  }
});

// PUT /api/pets/:petId/weights/:weightId - Update a weight entry
router.put('/:weightId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId, weightId } = req.params;
    const userId = req.authSession?.user.id;
    const updateData = req.body;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    if (!petId || !weightId) {
      throw new BadRequestError('Pet ID and Weight ID are required');
    }

    const weightEntry = await WeightEntriesService.updateWeightEntry(
      petId, 
      weightId, 
      userId, 
      updateData
    );
    

    respondWithSuccess(res, { weightEntry }, 'Weight entry updated successfully')
  } catch (error) {
    next(error);
  }
});

// DELETE /api/pets/:petId/weights/:weightId - Delete a weight bu
router.delete('/:weightId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { petId, weightId } = req.params;
    const userId = req.authSession?.user.id;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    if (!petId || !weightId) {
      throw new BadRequestError('Pet ID and Weight ID are required');
    }

    await WeightEntriesService.deleteWeightEntry(petId, weightId, userId);
    
    respondWithSuccess(res, null, 'Weight entry deleted successfully')
  } catch (error) {
    next(error);
  }
});

export default router;