import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { FoodService } from '../services/food.service';
import { globalAuthHandler, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { respondWithSuccess, respondWithCreated, respondWithError } from '../lib/json';
import { 
  BadRequestError, 
  NotFoundError, 
  UserForbiddenError 
} from '../middleware/errors';
import type { FoodEntryFormData, FoodType } from '../db/schema/food';

const router = Router();

// Apply auth middleware to all food routes
router.use(globalAuthHandler);

// GET /api/pets/:petId/food - Get all food entries for a pet
router.get('/:petId/food', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.petId;
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    const foodEntries = await FoodService.getFoodEntries(petId, userId);
    
    // Calculate remaining info for each entry
    const enrichedEntries = foodEntries.map(entry => ({
      ...entry,
      ...FoodService.calculateFoodRemaining(entry)
    }));

    const total = enrichedEntries.length;
    respondWithSuccess(res, { foodEntries: enrichedEntries, total }, `Retrieved ${total} food entries`);
  } catch (error) {
    next(error);
  }
});

// GET /api/pets/:petId/food/type/:foodType - Get food entries by type
router.get('/:petId/food/type/:foodType', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.petId;
    const foodType = req.params.foodType as FoodType;

    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    // Validate food type
    if (!['dry', 'wet', 'treats'].includes(foodType)) {
      throw new BadRequestError('Invalid food type. Must be dry, wet, or treats');
    }

    const foodEntries = await FoodService.getFoodEntriesByType(petId, userId, foodType);
    
    // Calculate remaining info for each entry
    const enrichedEntries = foodEntries.map(entry => ({
      ...entry,
      ...FoodService.calculateFoodRemaining(entry)
    }));

    const total = enrichedEntries.length;
    respondWithSuccess(res, { foodEntries: enrichedEntries, total }, `Retrieved ${total} ${foodType} food entries`);
  } catch (error) {
    next(error);
  }
});

// GET /api/pets/:petId/food/:foodId - Get a specific food entry
router.get('/:petId/food/:foodId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.petId;
    const foodId = req.params.foodId;

    if (!petId || !foodId) {
      throw new BadRequestError('Pet ID and Food ID are required');
    }

    const foodEntry = await FoodService.getFoodEntryById(petId, foodId, userId);
    const enrichedEntry = {
      ...foodEntry,
      ...FoodService.calculateFoodRemaining(foodEntry)
    };

    respondWithSuccess(res, { foodEntry: enrichedEntry }, 'Food entry retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/pets/:petId/food - Create a new food entry
router.post('/:petId/food', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.petId;
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    const foodData: FoodEntryFormData = req.body;

    // Basic validation
    if (!foodData.foodType || !foodData.bagWeight || !foodData.dailyAmount || !foodData.datePurchased) {
      throw new BadRequestError('Food type, bag weight, daily amount, and purchase date are required');
    }

    const newFoodEntry = await FoodService.createFoodEntry(petId, userId, {
      ...foodData,
      petId, // This will be overridden in the service
    });

    const enrichedEntry = {
      ...newFoodEntry,
      ...FoodService.calculateFoodRemaining(newFoodEntry)
    };

    respondWithCreated(res, { foodEntry: enrichedEntry }, 'Food entry created successfully');
  } catch (error) {
    next(error);
  }
});

// PUT /api/pets/:petId/food/:foodId - Update a food entry
router.put('/:petId/food/:foodId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.petId;
    const foodId = req.params.foodId;

    if (!petId || !foodId) {
      throw new BadRequestError('Pet ID and Food ID are required');
    }

    const updateData: Partial<FoodEntryFormData> = req.body;

    const updatedFoodEntry = await FoodService.updateFoodEntry(petId, foodId, userId, updateData);
    const enrichedEntry = {
      ...updatedFoodEntry,
      ...FoodService.calculateFoodRemaining(updatedFoodEntry)
    };

    respondWithSuccess(res, { foodEntry: enrichedEntry }, 'Food entry updated successfully');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/pets/:petId/food/:foodId - Delete a food entry
router.delete('/:petId/food/:foodId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.petId;
    const foodId = req.params.foodId;

    if (!petId || !foodId) {
      throw new BadRequestError('Pet ID and Food ID are required');
    }

    await FoodService.deleteFoodEntry(petId, foodId, userId);

    respondWithSuccess(res, {}, 'Food entry deleted successfully');
  } catch (error) {
    next(error);
  }
});

export default router;