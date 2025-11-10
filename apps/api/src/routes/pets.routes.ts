import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { PetsService } from '../services/pets.service';
import { globalAuthHandler, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { respondWithSuccess, respondWithCreated, respondWithError } from '../lib/json';
import { 
  validateCreatePet, 
  validateUpdatePet,
  type CreatePetData,
  type UpdatePetData
} from '../../../web/src/lib/validations/pet'; // Import from frontend validations
import { 
  BadRequestError, 
  NotFoundError, 
  UserForbiddenError 
} from '../middleware/errors';
import weightEntriesRoutes from './weight-entries.routes';
import weightTargetsRoutes from './weight-targets.routes';

const router = Router();

// Apply auth middleware to all pet routes
router.use(globalAuthHandler);

router.use('/:petId/weights', weightEntriesRoutes);
router.use('/:petId/weight-target', weightTargetsRoutes);
// GET /api/pets - Get all user's pets
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const pets = await PetsService.getUserPets(userId);
    const total = pets.length;

    respondWithSuccess(res, { pets, total }, `Retrieved ${total} pet(s)`);
  } catch (error) {
    next(error);
  }
});


// GET /api/pets/stats/count - Get user's pet count
router.get('/stats/count', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const count = await PetsService.getUserPetCount(userId);
    respondWithSuccess(res, { count }, `You have ${count} pet(s)`);
  } catch (error) {
    next(error);
  }
});

// GET /api/pets/:id - Get a specific pet
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.id;
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    const pet = await PetsService.getPetById(petId, userId);
    respondWithSuccess(res, { pet }, 'Pet retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/pets - Create a new pet
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    // Validate request body
    const validation = validateCreatePet(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const petData: CreatePetData = validation.data;

    // Add userId to the pet data
    const newPetData = {
      ...petData,
      userId,
    };

    const newPet = await PetsService.createPet(newPetData);
    respondWithCreated(res, { pet: newPet }, 'Pet created successfully');
  } catch (error) {
    next(error);
  }
});

// PUT /api/pets/:id - Update a pet
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.id;
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    // Add the pet ID to the request body for validation
    const dataToValidate = {
      ...req.body,
      id: petId,
    };

    // Validate request body
    const validation = validateUpdatePet(dataToValidate);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const updateData: UpdatePetData = validation.data;
    
    // Remove the ID from update data (it's already in the URL)
    const { id, ...petUpdateData } = updateData;

    const updatedPet = await PetsService.updatePet(petId, userId, petUpdateData);
    respondWithSuccess(res, { pet: updatedPet }, 'Pet updated successfully');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/pets/:id - Soft delete a pet
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.id;
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    await PetsService.deletePet(petId, userId);
    respondWithSuccess(res, null, 'Pet deleted successfully');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/pets/:id/permanent - Hard delete a pet (optional - for admin or permanent deletion)
router.delete('/:id/permanent', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.id;
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    await PetsService.hardDeletePet(petId, userId);
    respondWithSuccess(res, null, 'Pet permanently deleted');
  } catch (error) {
    next(error);
  }
});


export default router;