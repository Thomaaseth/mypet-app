import { z } from 'zod';
import { key } from './i18n-keys';

// The 3 protection categories a single treatment record can be tagged with.
export const ANTI_PARASITE_CATEGORIES = ['fleas_ticks', 'worms', 'heartworm'] as const;
export type AntiParasiteCategory = (typeof ANTI_PARASITE_CATEGORIES)[number];

export const antiParasiteCategorySchema = z.enum(ANTI_PARASITE_CATEGORIES, {
  errorMap: () => ({ message: key('antiParasite.validation.invalidCategory') }),
});

// Duration unit: weeks are exact-day math, months are calendar-month math.
// The unit must survive into storage (not just display) since expiry
// calculation branches on it
export const ANTI_PARASITE_DURATION_UNITS = ['weeks', 'months'] as const;
export type AntiParasiteDurationUnit = (typeof ANTI_PARASITE_DURATION_UNITS)[number];

export const antiParasiteDurationUnitSchema = z.enum(ANTI_PARASITE_DURATION_UNITS, {
  errorMap: () => ({ message: key('antiParasite.validation.invalidDurationUnit') }),
});

// Single source of truth for the duration dropdown
// Both the Zod refinement below and the frontend <Select> read this same array
export interface AntiParasiteDurationOption {
  unit: AntiParasiteDurationUnit;
  amount: number;
}

export const ANTI_PARASITE_DURATION_OPTIONS: readonly AntiParasiteDurationOption[] = [
  { unit: 'weeks', amount: 4 },
  { unit: 'weeks', amount: 5 },
  { unit: 'weeks', amount: 6 },
  { unit: 'weeks', amount: 7 },
  { unit: 'weeks', amount: 8 },
  { unit: 'months', amount: 3 },
  { unit: 'months', amount: 4 },
  { unit: 'months', amount: 5 },
  { unit: 'months', amount: 6 },
  { unit: 'months', amount: 7 },
  { unit: 'months', amount: 8 },
  { unit: 'months', amount: 9 },
  { unit: 'months', amount: 10 },
  { unit: 'months', amount: 11 },
  { unit: 'months', amount: 12 },
];

function isValidDurationCombination(unit: AntiParasiteDurationUnit, amount: number): boolean {
  return ANTI_PARASITE_DURATION_OPTIONS.some((opt) => opt.unit === unit && opt.amount === amount);
}

// A single <select> option can only carry one string value, but a duration is
// a { unit, amount } pair. We encode the pair as "unit:amount" (e.g. "weeks:4")
// for the option value, and decode it back at the form's submit boundary.
// Empty string ("") represents "nothing selected yet".
export function encodeDurationOption(option: AntiParasiteDurationOption): string {
  return `${option.unit}:${option.amount}`;
}

export function decodeDurationOption(
  value: string,
): { durationUnit: AntiParasiteDurationUnit; durationAmount: number } | null {
  const match = ANTI_PARASITE_DURATION_OPTIONS.find((opt) => encodeDurationOption(opt) === value);
  return match ? { durationUnit: match.unit, durationAmount: match.amount } : null;
}

// Base object (no .strict() here) so it stays extend/partial-able,
// same convention as basePetFormSchema / baseFoodValidation.
const baseAntiParasiteValidation = {
  productName: z
    .string()
    .trim()
    .min(1, key('antiParasite.validation.productNameRequired'))
    .max(50, key('antiParasite.validation.productNameTooLong')),

  categories: z
    .array(antiParasiteCategorySchema)
    .min(1, key('antiParasite.validation.categoriesRequired'))
    .max(ANTI_PARASITE_CATEGORIES.length, key('antiParasite.validation.categoriesInvalid'))
    .refine(
      (arr) => new Set(arr).size === arr.length,
      key('antiParasite.validation.categoriesInvalid'),
    ),

  durationUnit: antiParasiteDurationUnitSchema,

  durationAmount: z
    .number({ invalid_type_error: key('antiParasite.validation.durationAmountRequired') })
    .int(key('antiParasite.validation.durationAmountInvalid'))
    .positive(key('antiParasite.validation.durationAmountInvalid')),

  dateAdministered: z
    .string()
    .min(1, key('antiParasite.validation.dateRequired'))
    .refine((val) => !isNaN(new Date(val).getTime()), key('antiParasite.validation.invalidDate')),
};

// CREATE: all fields required, full cross-field validation.
export const antiParasiteTreatmentFormSchema = z
  .object(baseAntiParasiteValidation)
  .strict()
  .superRefine((data, ctx) => {
    if (!isValidDurationCombination(data.durationUnit, data.durationAmount)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: key('antiParasite.validation.durationCombinationInvalid'),
        path: ['durationAmount'],
      });
    }
  });

// UPDATE: the edit form always resubmits the complete record (no partial-field-only editing in the UI). 
// .partial() is kept only for the same API-level flexibility convention used by
// updateWeightEntrySchema; the frontend never actually sends a partial body.
// IMPORTANT: if `categories` is present, it REPLACES the full set for that
// record, this is not an add/remove diff against the existing categories,
// since categories are backed by a join table (see db schema) with no
// concept of a partial patch.
export const updateAntiParasiteTreatmentSchema = z
  .object(baseAntiParasiteValidation)
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    // durationAmount and durationUnit must travel together, same pairing
    // rule as weight/weightUnit in updateWeightEntrySchema.
    if (data.durationAmount !== undefined && data.durationUnit === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: key('antiParasite.validation.durationUnitRequiredForUpdate'),
        path: ['durationUnit'],
      });
    }
    if (data.durationUnit !== undefined && data.durationAmount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: key('antiParasite.validation.durationAmountRequiredForUpdate'),
        path: ['durationAmount'],
      });
    }
    if (data.durationUnit !== undefined && data.durationAmount !== undefined) {
      if (!isValidDurationCombination(data.durationUnit, data.durationAmount)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: key('antiParasite.validation.durationCombinationInvalid'),
          path: ['durationAmount'],
        });
      }
    }
  });

  // --- Form-only schema ------------------------------------------------------
// The FORM works in { ...fields, duration: string } because the duration
// dropdown is one control. This validates the form shape (duration must be a
// non-empty, known option string); the submit handler then decodes `duration`
// into durationUnit + durationAmount and the shared API schema
// (antiParasiteTreatmentFormSchema) guards the server. This mirrors how the
// food form validates its own shape and transforms before the API boundary.
export const antiParasiteTreatmentFormFieldsSchema = z
  .object({
    productName: baseAntiParasiteValidation.productName,
    categories: baseAntiParasiteValidation.categories,
    dateAdministered: baseAntiParasiteValidation.dateAdministered,
    duration: z
      .string()
      .min(1, key('antiParasite.validation.durationRequired'))
      .refine((val) => decodeDurationOption(val) !== null, key('antiParasite.validation.durationCombinationInvalid')),
  })
  .strict();

export type AntiParasiteTreatmentFormData = z.infer<typeof antiParasiteTreatmentFormSchema>;
export type UpdateAntiParasiteTreatmentData = z.infer<typeof updateAntiParasiteTreatmentSchema>;
export type AntiParasiteTreatmentFormFields = z.infer<typeof antiParasiteTreatmentFormFieldsSchema>;