import { Router } from 'express';
import { WeightTargetsService } from '../services/weight-targets.service';
import { globalAuthHandler } from '../middleware/auth.middleware';
import { BadRequestError } from '../middleware/errors';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true }); // mergeParams to access petId from parent route

// Apply auth middleware to all routes
router.use(globalAuthHandler);

// GET /api/pets/:petId/weight-target - Get weight target for a pet
router.get('/', async (req: AuthenticatedRequest, res) => {
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
    
    res.json({
      success: true,
      data: {
        weightTarget: target
      }
    });
  } catch (error) {
    console.error('GET /weight-target error:', error);
    throw error;
  }
});

// PUT /api/pets/:petId/weight-target - Create or update weight target (upsert)
router.put('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { petId } = req.params;
    const userId = req.authSession?.user.id;
    const { minWeight, maxWeight, weightUnit } = req.body;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    if (!minWeight || !maxWeight || !weightUnit) {
      throw new BadRequestError('Minimum weight, maximum weight, and weight unit are required');
    }

    const weightTarget = await WeightTargetsService.upsertWeightTarget(
      petId, 
      userId, 
      { minWeight, maxWeight, weightUnit }
    );
    
    res.json({
      success: true,
      data: {
        weightTarget
      },
      message: 'Weight target saved successfully'
    });
  } catch (error) {
    console.error('PUT /weight-target error:', error);
    throw error;
  }
});

// DELETE /api/pets/:petId/weight-target - Delete weight target
router.delete('/', async (req: AuthenticatedRequest, res) => {
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
    
    res.json({
      success: true,
      message: 'Weight target deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /weight-target error:', error);
    throw error;
  }
});

export default router;