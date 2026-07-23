import type { PetGender } from '@/types/pet';

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