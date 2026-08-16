import type {
  AntiParasiteCategory,
  AntiParasiteDurationUnit,
} from '@/lib/validations/anti-parasite-treatment';

// Read model — mirrors the API's EnrichedAntiParasiteTreatment: the stored
// row plus the two server-computed fields (categories flattened from the
// join table, expiryDate = "protected until"). Neither computed field is
// ever sent back on write.
export interface AntiParasiteTreatment {
  id: string;
  petId: string;
  productName: string;
  durationUnit: AntiParasiteDurationUnit;
  durationAmount: number;
  dateAdministered: string; // YYYY-MM-DD
  categories: AntiParasiteCategory[];
  expiryDate: string; // YYYY-MM-DD, computed server-side
  isActive: boolean; // computed server-side against the user's tz-aware today
  createdAt: string;
  updatedAt: string;
}

// Form/write model — what the create form submits. No id/petId/timestamps,
// no expiryDate (server computes it). Mirrors the shape of
// AntiParasiteTreatmentFormData from the shared schema, but typed here for
// the web layer's own consumption (form state, repository body).
export interface AntiParasiteTreatmentFormData {
  productName: string;
  categories: AntiParasiteCategory[];
  durationUnit: AntiParasiteDurationUnit;
  durationAmount: number;
  dateAdministered: string; // YYYY-MM-DD
}