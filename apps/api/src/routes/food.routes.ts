// apps/api/src/routes/food.routes.ts
import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { FoodService } from '../services/food.service';
import { globalAuthHandler, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { respondWithSuccess, respondWithCreated } from '../lib/json';
import { BadRequestError } from '../middleware/errors';

type DryFoodFormData = {
  brandName?: string;
  productName?: string;
  bagWeight: string;
  bagWeightUnit: 'kg' | 'pounds';
  dailyAmount: string;
  dryDailyAmountUnit: 'grams' | 'cups';
  datePurchased: string;
};

type WetFoodFormData = {
  brandName?: string;
  productName?: string;
  numberOfUnits: string; // String from form
  weightPerUnit: string;
  wetWeightUnit: 'grams' | 'oz';
  dailyAmount: string;
  wetDailyAmountUnit: 'grams' | 'oz';
  datePurchased: string;
};

const router = Router();

// Apply auth middleware to all food routes
router.use(globalAuthHandler);

// 🎯 DRY FOOD ROUTES
// GET /api/pets/:petId/food/dry - Get all dry food entries
router.get('/:petId/food/dry', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.petId;
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    const dryFoodEntries = await FoodService.getDryFoodEntries(petId, userId);
    
    // Calculate remaining info for each entry
    const enrichedEntries = dryFoodEntries.map(entry => ({
      ...entry,
      ...FoodService.calculateDryFoodRemaining(entry)
    }));

    const total = enrichedEntries.length;
    respondWithSuccess(res, { foodEntries: enrichedEntries, total }, `Retrieved ${total} dry food entries`);
  } catch (error) {
    next(error);
  }
});

// GET /api/pets/:petId/food/dry/:foodId - Get specific dry food entry
router.get('/:petId/food/dry/:foodId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const { petId, foodId } = req.params;
    if (!petId || !foodId) {
      throw new BadRequestError('Pet ID and Food ID are required');
    }

    const dryFoodEntry = await FoodService.getDryFoodEntryById(petId, foodId, userId);
    const enrichedEntry = {
      ...dryFoodEntry,
      ...FoodService.calculateDryFoodRemaining(dryFoodEntry)
    };

    respondWithSuccess(res, { foodEntry: enrichedEntry }, 'Dry food entry retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/pets/:petId/food/dry - Create dry food entry
router.post('/:petId/food/dry', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.petId;
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    const dryFoodData: DryFoodFormData = req.body;

    // Basic validation
    if (!dryFoodData || typeof dryFoodData !== 'object') {
      throw new BadRequestError('Request body is required');
    }

    if (!dryFoodData.dailyAmount || !dryFoodData.datePurchased) {
      throw new BadRequestError('Daily amount and purchase date are required');
    }

    const newDryFoodEntry = await FoodService.createDryFoodEntry(petId, userId, dryFoodData);

    const enrichedEntry = {
      ...newDryFoodEntry,
      ...FoodService.calculateDryFoodRemaining(newDryFoodEntry)
    };

    respondWithCreated(res, { foodEntry: enrichedEntry }, 'Dry food entry created successfully');
  } catch (error) {
   next(error);
 }
});

// PUT /api/pets/:petId/food/dry/:foodId - Update dry food entry
router.put('/:petId/food/dry/:foodId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
 try {
   const userId = req.authSession?.user.id;
   if (!userId) {
     throw new BadRequestError('User session not found');
   }

   const { petId, foodId } = req.params;
   if (!petId || !foodId) {
     throw new BadRequestError('Pet ID and Food ID are required');
   }

   const updateData: Partial<DryFoodFormData> = req.body;

   if (!updateData || typeof updateData !== 'object') {
     throw new BadRequestError('Request body is required');
   }

   const updatedDryFoodEntry = await FoodService.updateDryFoodEntry(petId, foodId, userId, updateData);
   
   const enrichedEntry = {
     ...updatedDryFoodEntry,
     ...FoodService.calculateDryFoodRemaining(updatedDryFoodEntry)
   };

   respondWithSuccess(res, { foodEntry: enrichedEntry }, 'Dry food entry updated successfully');
 } catch (error) {
   next(error);
 }
});

// 🎯 WET FOOD ROUTES
// GET /api/pets/:petId/food/wet - Get all wet food entries
router.get('/:petId/food/wet', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
 try {
   const userId = req.authSession?.user.id;
   if (!userId) {
     throw new BadRequestError('User session not found');
   }

   const petId = req.params.petId;
   if (!petId) {
     throw new BadRequestError('Pet ID is required');
   }

   const wetFoodEntries = await FoodService.getWetFoodEntries(petId, userId);
   
   // Calculate remaining info for each entry
   const enrichedEntries = wetFoodEntries.map(entry => ({
     ...entry,
     ...FoodService.calculateWetFoodRemaining(entry)
   }));

   const total = enrichedEntries.length;
   respondWithSuccess(res, { foodEntries: enrichedEntries, total }, `Retrieved ${total} wet food entries`);
 } catch (error) {
   next(error);
 }
});

// GET /api/pets/:petId/food/wet/:foodId - Get specific wet food entry
router.get('/:petId/food/wet/:foodId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
 try {
   const userId = req.authSession?.user.id;
   if (!userId) {
     throw new BadRequestError('User session not found');
   }

   const { petId, foodId } = req.params;
   if (!petId || !foodId) {
     throw new BadRequestError('Pet ID and Food ID are required');
   }

   const wetFoodEntry = await FoodService.getWetFoodEntryById(petId, foodId, userId);
   const enrichedEntry = {
     ...wetFoodEntry,
     ...FoodService.calculateWetFoodRemaining(wetFoodEntry)
   };

   respondWithSuccess(res, { foodEntry: enrichedEntry }, 'Wet food entry retrieved successfully');
 } catch (error) {
   next(error);
 }
});

// POST /api/pets/:petId/food/wet - Create wet food entry
router.post('/:petId/food/wet', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
 try {
   const userId = req.authSession?.user.id;
   if (!userId) {
     throw new BadRequestError('User session not found');
   }

   const petId = req.params.petId;
   if (!petId) {
     throw new BadRequestError('Pet ID is required');
   }

   const wetFoodData: WetFoodFormData = req.body;

   // Basic validation
   if (!wetFoodData || typeof wetFoodData !== 'object') {
     throw new BadRequestError('Request body is required');
   }

   if (!wetFoodData.dailyAmount || !wetFoodData.datePurchased) {
     throw new BadRequestError('Daily amount and purchase date are required');
   }

   const newWetFoodEntry = await FoodService.createWetFoodEntry(petId, userId, wetFoodData);

   const enrichedEntry = {
     ...newWetFoodEntry,
     ...FoodService.calculateWetFoodRemaining(newWetFoodEntry)
   };

   respondWithCreated(res, { foodEntry: enrichedEntry }, 'Wet food entry created successfully');
 } catch (error) {
   next(error);
 }
});

// PUT /api/pets/:petId/food/wet/:foodId - Update wet food entry
router.put('/:petId/food/wet/:foodId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
 try {
   const userId = req.authSession?.user.id;
   if (!userId) {
     throw new BadRequestError('User session not found');
   }

   const { petId, foodId } = req.params;
   if (!petId || !foodId) {
     throw new BadRequestError('Pet ID and Food ID are required');
   }

   const updateData: Partial<WetFoodFormData> = req.body;

   if (!updateData || typeof updateData !== 'object') {
     throw new BadRequestError('Request body is required');
   }

   const updatedWetFoodEntry = await FoodService.updateWetFoodEntry(petId, foodId, userId, updateData);
   
   const enrichedEntry = {
     ...updatedWetFoodEntry,
     ...FoodService.calculateWetFoodRemaining(updatedWetFoodEntry)
   };

   respondWithSuccess(res, { foodEntry: enrichedEntry }, 'Wet food entry updated successfully');
 } catch (error) {
   next(error);
 }
});

// 🎯 COMBINED ROUTES
// GET /api/pets/:petId/food - Get all food entries (both dry and wet)
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

   const allFoodEntries = await FoodService.getAllFoodEntries(petId, userId);
   
   // Calculate remaining info for each entry based on type
   const enrichedEntries = allFoodEntries.map(entry => {
     if (entry.foodType === 'dry') {
       return {
         ...entry,
         ...FoodService.calculateDryFoodRemaining(entry as any)
       };
     } else {
       return {
         ...entry,
         ...FoodService.calculateWetFoodRemaining(entry as any)
       };
     }
   });

   const total = enrichedEntries.length;
   respondWithSuccess(res, { foodEntries: enrichedEntries, total }, `Retrieved ${total} food entries`);
 } catch (error) {
   next(error);
 }
});

// DELETE /api/pets/:petId/food/:foodId - Delete any food entry (works for both types)
router.delete('/:petId/food/:foodId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
 try {
   const userId = req.authSession?.user.id;
   if (!userId) {
     throw new BadRequestError('User session not found');
   }

   const { petId, foodId } = req.params;
   if (!petId || !foodId) {
     throw new BadRequestError('Pet ID and Food ID are required');
   }

   await FoodService.deleteFoodEntry(petId, foodId, userId);

   respondWithSuccess(res, { 
     message: 'Food entry deleted successfully',
     deletedId: foodId 
   }, 'Food entry deleted successfully');
 } catch (error) {
   next(error);
 }
});

export default router;