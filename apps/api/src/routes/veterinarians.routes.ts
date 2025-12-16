import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { VeterinariansService } from '../services/veterinarians.service';
import { globalAuthHandler, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { respondWithSuccess, respondWithCreated } from '../lib/json';
import { 
  validateCreateVeterinarian, 
  validateUpdateVeterinarian,
  type VeterinarianFormData,
} from '../../../web/src/lib/validations/veterinarians';
import { 
  BadRequestError, 
  NotFoundError 
} from '../middleware/errors';

const router = Router();

// Apply auth middleware to all veterinarian routes
router.use(globalAuthHandler);

// GET /api/vets - Get all user's veterinarians
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const vets = await VeterinariansService.getUserVeterinarians(userId);
    const total = vets.length;

    respondWithSuccess(res, { veterinarians: vets, total }, `Retrieved ${total} veterinarian(s)`);
  } catch (error) {
    next(error);
  }
});

// GET /api/vets/:id - Get a specific veterinarian
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const vetId = req.params.id;
    if (!vetId) {
      throw new BadRequestError('Veterinarian ID is required');
    }

    const vet = await VeterinariansService.getVeterinarianById(vetId, userId);
    respondWithSuccess(res, { veterinarian: vet }, 'Veterinarian retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// GET /api/vets/:id/pets - Get pets assigned to a veterinarian
router.get('/:id/pets', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const vetId = req.params.id;
    if (!vetId) {
      throw new BadRequestError('Veterinarian ID is required');
    }

    const pets = await VeterinariansService.getVetPets(vetId, userId);
    respondWithSuccess(res, { pets }, 'Assigned pets retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/vets - Create a new veterinarian
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    // Validate request body
    const validation = validateCreateVeterinarian(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const vetData: VeterinarianFormData = validation.data;

    // Extract pet assignment data if provided
    const { petIds } = req.body;

    const newVet = await VeterinariansService.createVeterinarian({
      ...vetData,
      userId,
    },
    petIds
  );
    

    respondWithCreated(res, { veterinarian: newVet }, 'Veterinarian created successfully');
  } catch (error) {
    next(error);
  }
});

// PUT /api/vets/:id - Update a veterinarian
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const vetId = req.params.id;
    if (!vetId) {
      throw new BadRequestError('Veterinarian ID is required');
    }

    // Add the vet ID to the request body for validation
    const dataToValidate = {
      ...req.body,
      id: vetId,
    };

    // Validate request body
    const validation = validateUpdateVeterinarian(dataToValidate);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const updateData = validation.data;
    
    // Remove the ID from update data (it's already in the URL)
    const { id, ...vetUpdateData } = updateData;

    const updatedVet = await VeterinariansService.updateVeterinarian(vetId, userId, vetUpdateData);
    respondWithSuccess(res, { veterinarian: updatedVet }, 'Veterinarian updated successfully');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vets/:id - Soft delete a veterinarian
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const vetId = req.params.id;
    if (!vetId) {
      throw new BadRequestError('Veterinarian ID is required');
    }

    await VeterinariansService.deleteVeterinarian(vetId, userId);
    respondWithSuccess(res, null, 'Veterinarian deleted successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/vets/:id/assign - Assign veterinarian to pets
router.post('/:id/assign', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const vetId = req.params.id;
    if (!vetId) {
      throw new BadRequestError('Veterinarian ID is required');
    }

    const { petIds } = req.body;

    if (!petIds || !Array.isArray(petIds) || petIds.length === 0) {
      throw new BadRequestError('At least one pet ID is required');
    }

    await VeterinariansService.assignVetToPets(vetId, userId, petIds);
    respondWithSuccess(res, null, 'Veterinarian assigned to pets successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/vets/:id/unassign - Unassign veterinarian from pets
router.post('/:id/unassign', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const vetId = req.params.id;
    if (!vetId) {
      throw new BadRequestError('Veterinarian ID is required');
    }

    const { petIds } = req.body;

    if (!petIds || !Array.isArray(petIds) || petIds.length === 0) {
      throw new BadRequestError('At least one pet ID is required');
    }

    await VeterinariansService.unassignVetFromPets(vetId, userId, petIds);
    respondWithSuccess(res, null, 'Veterinarian unassigned from pets successfully');
  } catch (error) {
    next(error);
  }
});

export default router;