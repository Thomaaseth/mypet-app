import { AntiParasiteTreatmentService } from './service';
import { antiParasiteTreatmentRepository } from './repository';
import type { AntiParasiteTreatmentFormData } from '@/types/anti-parasite-treatments';
import type { UpdateAntiParasiteTreatmentData } from '@/lib/validations/anti-parasite-treatment';

const antiParasiteTreatmentService = new AntiParasiteTreatmentService(antiParasiteTreatmentRepository);

export const antiParasiteTreatmentApi = {
  getTreatments: (petId: string) => antiParasiteTreatmentService.getTreatments(petId),
  getTreatmentById: (petId: string, treatmentId: string) =>
    antiParasiteTreatmentService.getTreatmentById(petId, treatmentId),
  createTreatment: (petId: string, data: AntiParasiteTreatmentFormData) =>
    antiParasiteTreatmentService.createTreatment(petId, data),
  updateTreatment: (petId: string, treatmentId: string, data: UpdateAntiParasiteTreatmentData) =>
    antiParasiteTreatmentService.updateTreatment(petId, treatmentId, data),
  deleteTreatment: (petId: string, treatmentId: string) =>
    antiParasiteTreatmentService.deleteTreatment(petId, treatmentId),
};

export const antiParasiteTreatmentErrorHandler = (error: unknown) =>
  antiParasiteTreatmentService.mapError(error);

export type { AntiParasiteTreatmentError } from './types';

export { AntiParasiteTreatmentRepository } from './repository';
export { AntiParasiteTreatmentService } from './service';