import type { PetGender } from '@/lib/validations/pet';
import type { AppointmentType } from '@/types/appointments';
import type { DateFormat } from '@/shared/validations/date-format';
import type { TimeFormat } from '@/shared/validations/time-format';
import type { UnitSystem } from '@/shared/validations/units';
import type { AntiParasiteCategory } from '@/lib/validations/anti-parasite-treatment';

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

export const DATE_FORMAT_LABEL_KEYS = {
  DMY: 'preferences.dateFormat.DMY.label',
  MDY: 'preferences.dateFormat.MDY.label',
} as const satisfies Record<DateFormat, string>;

export const DATE_FORMAT_DESCRIPTION_KEYS = {
  DMY: 'preferences.dateFormat.DMY.description',
  MDY: 'preferences.dateFormat.MDY.description',
} as const satisfies Record<DateFormat, string>;

export const TIME_FORMAT_LABEL_KEYS = {
  '24h': 'preferences.timeFormat.24h.label',
  '12h': 'preferences.timeFormat.12h.label',
} as const satisfies Record<TimeFormat, string>;

export const TIME_FORMAT_DESCRIPTION_KEYS = {
  '24h': 'preferences.timeFormat.24h.description',
  '12h': 'preferences.timeFormat.12h.description',
} as const satisfies Record<TimeFormat, string>;
 
export const UNIT_SYSTEM_LABEL_KEYS = {
  metric: 'preferences.unitSystem.metric.label',
  imperial: 'preferences.unitSystem.imperial.label',
} as const satisfies Record<UnitSystem, string>;
 
export const UNIT_SYSTEM_DESCRIPTION_KEYS = {
  metric: 'preferences.unitSystem.metric.description',
  imperial: 'preferences.unitSystem.imperial.description',
} as const satisfies Record<UnitSystem, string>;

export const ANTI_PARASITE_CATEGORY_KEYS = {
  fleas_ticks: 'antiParasite.category.fleasTicks',
  worms: 'antiParasite.category.worms',
  heartworm: 'antiParasite.category.heartworm',
} as const satisfies Record<AntiParasiteCategory, string>;

// Keyed by the encoded "unit:amount" dropdown value.
export const ANTI_PARASITE_DURATION_OPTION_KEYS = {
  'weeks:4': 'antiParasite.duration.weeks4',
  'weeks:5': 'antiParasite.duration.weeks5',
  'weeks:6': 'antiParasite.duration.weeks6',
  'weeks:7': 'antiParasite.duration.weeks7',
  'weeks:8': 'antiParasite.duration.weeks8',
  'months:3': 'antiParasite.duration.months3',
  'months:4': 'antiParasite.duration.months4',
  'months:5': 'antiParasite.duration.months5',
  'months:6': 'antiParasite.duration.months6',
  'months:7': 'antiParasite.duration.months7',
  'months:8': 'antiParasite.duration.months8',
  'months:9': 'antiParasite.duration.months9',
  'months:10': 'antiParasite.duration.months10',
  'months:11': 'antiParasite.duration.months11',
  'months:12': 'antiParasite.duration.months12',
} as const;