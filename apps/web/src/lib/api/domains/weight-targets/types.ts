import type { WeightTarget, WeightTargetFormData } from '@/types/weight-targets';

export interface WeightTargetApiResponse {
    weightTarget: WeightTarget | null;
}

export interface WeightTargetError {
    message: string;
    field?: keyof WeightTargetFormData;
    code: string;
}