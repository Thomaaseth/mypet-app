import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { AppointmentsService } from '../services/appointments.service';
import { globalAuthHandler, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { respondWithSuccess, respondWithCreated } from '../lib/json';
import { 
  validateCreateAppointment, 
  validateUpdateAppointment,
  validateUpdateVisitNotes,
  type AppointmentFormData,
  type UpdateVisitNotesData,
} from '../../../web/src/lib/validations/appointments';
import { 
  BadRequestError, 
  NotFoundError 
} from '../middleware/errors';

const router = Router();

// Apply auth middleware to all appointment routes
router.use(globalAuthHandler);

// GET /api/appointments - Get all user's appointments (with filter)
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    // Get filter from query params (default: upcoming)
    const filter = req.query.filter as 'upcoming' | 'past' | undefined;
    if (filter && filter !== 'upcoming' && filter !== 'past') {
      throw new BadRequestError('Filter must be either "upcoming" or "past"');
    }

    const appointments = await AppointmentsService.getAppointments(
      userId, 
      filter || 'upcoming'
    );
    const total = appointments.length;

    respondWithSuccess(
      res, 
      { appointments, total }, 
      `Retrieved ${total} ${filter || 'upcoming'} appointment(s)`
    );
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments/:id - Get a specific appointment
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const appointmentId = req.params.id;
    if (!appointmentId) {
      throw new BadRequestError('Appointment ID is required');
    }

    const appointment = await AppointmentsService.getAppointmentById(appointmentId, userId);
    respondWithSuccess(res, { appointment }, 'Appointment retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments/last-vet/:petId - Get last vet used for a pet
router.get('/last-vet/:petId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const petId = req.params.petId;
    if (!petId) {
      throw new BadRequestError('Pet ID is required');
    }

    const veterinarianId = await AppointmentsService.getLastVetForPet(petId, userId);
    
    respondWithSuccess(
      res, 
      { veterinarianId }, 
      veterinarianId 
        ? 'Last vet retrieved successfully' 
        : 'No previous appointments found for this pet'
    );
  } catch (error) {
    next(error);
  }
});

// POST /api/appointments - Create a new appointment
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    // Validate request body
    const validation = validateCreateAppointment(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const appointmentData: AppointmentFormData = validation.data;

    const newAppointment = await AppointmentsService.createAppointment(appointmentData, userId);

    respondWithCreated(res, { appointment: newAppointment }, 'Appointment created successfully');
  } catch (error) {
    next(error);
  }
});

// PUT /api/appointments/:id - Update an appointment (full edit)
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const appointmentId = req.params.id;
    if (!appointmentId) {
      throw new BadRequestError('Appointment ID is required');
    }

    // Validate request body
    const validation = validateUpdateAppointment({ ...req.body, id: appointmentId });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const updateData: Partial<AppointmentFormData> = validation.data;
    delete (updateData as any).id; // Remove id from update data

    const updatedAppointment = await AppointmentsService.updateAppointment(
      appointmentId,
      updateData,
      userId
    );

    respondWithSuccess(res, { appointment: updatedAppointment }, 'Appointment updated successfully');
  } catch (error) {
    next(error);
  }
});

// PATCH /api/appointments/:id/notes - Update visit notes only
router.patch('/:id/notes', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const appointmentId = req.params.id;
    if (!appointmentId) {
      throw new BadRequestError('Appointment ID is required');
    }

    // Validate request body
    const validation = validateUpdateVisitNotes(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const { visitNotes } = validation.data;

    const updatedAppointment = await AppointmentsService.updateVisitNotes(
      appointmentId,
      visitNotes || '',
      userId
    );

    respondWithSuccess(res, { appointment: updatedAppointment }, 'Visit notes updated successfully');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/appointments/:id - Delete an appointment
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.authSession?.user.id;
    if (!userId) {
      throw new BadRequestError('User session not found');
    }

    const appointmentId = req.params.id;
    if (!appointmentId) {
      throw new BadRequestError('Appointment ID is required');
    }

    await AppointmentsService.deleteAppointment(appointmentId, userId);

    respondWithSuccess(res, null, 'Appointment deleted successfully');
  } catch (error) {
    next(error);
  }
});

export default router;