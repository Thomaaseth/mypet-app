import type { PetGender } from '@/types/pet';
import type { AppointmentType } from '@/types/appointments';
import type { DateTimeLocale } from '@/shared/validations/locale';
import type { UnitSystem } from '@/shared/validations/units';

/**
 * Maps runtime enum values to their translation keys.
 *
 * We can't build keys dynamically (e.g. `pets.gender.${value}`) because that
 * produces a plain `string` type, defeating the strict typed-key checking on
 * `t()`. This record keeps every key a compile-time literal, so a typo here
 * or a missing case still fails to compile.
 */
export const PET_GENDER_KEYS = {
  male: 'pets.gender.male',
  female: 'pets.gender.female',
  unknown: 'pets.gender.unknown',
} as const satisfies Record<PetGender, string>;

export const ANIMAL_TYPE_KEYS = {
  cat: 'pets.animalType.cat',
  dog: 'pets.animalType.dog',
} as const satisfies Record<'cat' | 'dog', string>;

export const WEIGHT_TREND_KEYS = {
  increasing: 'weights.tracker.trendIncreasing',
  decreasing: 'weights.tracker.trendDecreasing',
  stable: 'weights.tracker.trendStable',
} as const satisfies Record<'increasing' | 'decreasing' | 'stable', string>;

export const WEIGHT_STATUS_KEYS = {
  within: 'weights.tracker.statusWithin',
  above: 'weights.tracker.statusAbove',
  below: 'weights.tracker.statusBelow',
} as const satisfies Record<'within' | 'above' | 'below', string>;

export const FOOD_TYPE_TAB_KEYS = {
  dry: 'food.tracker.dryFoodTab',
  wet: 'food.tracker.wetFoodTab',
} as const satisfies Record<'dry' | 'wet', string>;

export const FOOD_SUPPLY_LABEL_KEYS = {
  dry: 'food.tracker.drySupplyLabel',
  wet: 'food.tracker.wetSupplyLabel',
} as const satisfies Record<'dry' | 'wet', string>;

export const FEEDING_STATUS_KEYS = {
  overfeeding: 'food.tracker.statusOverfeeding',
  'slightly-over': 'food.tracker.statusSlightlyOver',
  underfeeding: 'food.tracker.statusUnderfeeding',
  'slightly-under': 'food.tracker.statusSlightlyUnder',
  normal: 'food.tracker.statusNormal',
} as const satisfies Record<'overfeeding' | 'slightly-over' | 'underfeeding' | 'slightly-under' | 'normal', string>;

export const FOOD_HISTORY_TITLE_KEYS = {
  dry: 'food.dry.historyTitle',
  wet: 'food.wet.historyTitle',
} as const satisfies Record<'dry' | 'wet', string>;

export const APPOINTMENT_TYPE_KEYS = {
  checkup: 'appointments.type.checkup',
  vaccination: 'appointments.type.vaccination',
  surgery: 'appointments.type.surgery',
  dental: 'appointments.type.dental',
  grooming: 'appointments.type.grooming',
  emergency: 'appointments.type.emergency',
  other: 'appointments.type.other',
} as const satisfies Record<AppointmentType, string>;

export const DATE_TIME_LOCALE_LABEL_KEYS = {
  'fr-FR': 'preferences.dateTimeLocale.frFR.label',
  'en-US': 'preferences.dateTimeLocale.enUS.label',
} as const satisfies Record<DateTimeLocale, string>;
 
export const DATE_TIME_LOCALE_DESCRIPTION_KEYS = {
  'fr-FR': 'preferences.dateTimeLocale.frFR.description',
  'en-US': 'preferences.dateTimeLocale.enUS.description',
} as const satisfies Record<DateTimeLocale, string>;
 
export const UNIT_SYSTEM_LABEL_KEYS = {
  metric: 'preferences.unitSystem.metric.label',
  imperial: 'preferences.unitSystem.imperial.label',
} as const satisfies Record<UnitSystem, string>;
 
export const UNIT_SYSTEM_DESCRIPTION_KEYS = {
  metric: 'preferences.unitSystem.metric.description',
  imperial: 'preferences.unitSystem.imperial.description',
} as const satisfies Record<UnitSystem, string>;