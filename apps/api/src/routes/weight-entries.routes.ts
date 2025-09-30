import { Router } from 'express';
import { WeightEntriesService } from '../services/weight-entries.service';
import { globalAuthHandler } from '../middleware/auth.middleware';
import { BadRequestError } from '../middleware/errors';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true }); // mergeParams to access petId from parent route

// Apply auth middleware to all routes
router.use(globalAuthHandler);

// GET /api/pets/:petId/weights - Get all weight entries for a pet
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

    const result = await WeightEntriesService.getWeightEntries(petId, userId);
    
    res.json({
      success: true,
      data: {
        weightEntries: result.weightEntries,
        total: result.weightEntries.length,
        weightUnit: result.weightUnit
      }
    });
  } catch (error) {
    console.error('GET /weights error:', error);
    throw error;
  }
});

// GET /api/pets/:petId/weights/:weightId - Get a specific weight entry
router.get('/:weightId', async (req: AuthenticatedRequest, res) => {
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
    
    res.json({
      success: true,
      data: {
        weightEntry
      }
    });
  } catch (error) {
    console.error('GET /weights/:weightId error:', error);
    throw error;
  }
});

// POST /api/pets/:petId/weights - Create a new weight entry
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { petId } = req.params;
    const userId = req.authSession?.user.id;
    const { weight, date } = req.body;

    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    if (!weight || !date) {
      throw new BadRequestError('Weight and date are required');
    }

    const weightEntry = await WeightEntriesService.createWeightEntry(
      petId, 
      userId, 
      { weight, date }
    );
    
    res.status(201).json({
      success: true,
      data: {
        weightEntry
      },
      message: 'Weight entry created successfully'
    });
  } catch (error) {
    console.error('POST /weights error:', error);
    throw error;
  }
});

// PUT /api/pets/:petId/weights/:weightId - Update a weight entry
router.put('/:weightId', async (req: AuthenticatedRequest, res) => {
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
    
    res.json({
      success: true,
      data: {
        weightEntry
      },
      message: 'Weight entry updated successfully'
    });
  } catch (error) {
    console.error('PUT /weights/:weightId error:', error);
    throw error;
  }
});

// DELETE /api/pets/:petId/weights/:weightId - Delete a weight bu
router.delete('/:weightId', async (req: AuthenticatedRequest, res) => {
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
    
    res.json({
      success: true,
      message: 'Weight entry deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /weights/:weightId error:', error);
    throw error;
  }
});

export default router;