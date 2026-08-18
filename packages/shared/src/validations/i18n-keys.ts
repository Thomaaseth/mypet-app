/**
 * Zod validation schemas in this package are used by BOTH apps/web (which
 * has i18next and can translate) and apps/api (which has no i18n concept —
 * it just needs a stable string). Rather than hardcoding English text, every
 * `.min()`/`.max()`/`.regex()`/`refine({ message })` argument stores a
 * translation KEY string instead — apps/web translates it via `t()` at the
 * point it renders `errors.field.message`; apps/api can ignore it or pass it
 * straight through as an error code.
 *
 * `ValidationMessageKey` is the closed set of key strings this package is
 * allowed to emit. The `key()` helper forces every message argument through
 * this type, so a typo'd key fails `tsc` here rather than silently rendering
 * as a raw, untranslated string in the UI.
 *
 * This does NOT guarantee the key actually exists in apps/web's translation
 * resources — this package must never import from apps/web (wrong direction
 * of the dependency graph). That check lives in
 * apps/web/src/i18n/__typecheck__/validation-keys.assert.ts, which verifies
 * this exact union is a subset of the real, flattened translation-key type
 * derived from the actual `en` resource tree. If you add a key here, add the
 * matching literal string to the real translation files too, or that
 * assertion file will fail to compile.
 */
export type ValidationMessageKey =
  // auth.validation.*
  | 'auth.validation.confirmPasswordRequired'
  | 'auth.validation.currentPasswordRequired'
  | 'auth.validation.invalidEmail'
  | 'auth.validation.passwordLowercase'
  | 'auth.validation.passwordMaxLength'
  | 'auth.validation.passwordMinLength'
  | 'auth.validation.passwordNumber'
  | 'auth.validation.passwordSpecialChar'
  | 'auth.validation.passwordsDoNotMatch'
  | 'auth.validation.passwordUppercase'
  // food.validation.*
  | 'food.validation.bagWeightMustBePositive'
  | 'food.validation.bagWeightRequired'
  | 'food.validation.bagWeightUnitRequired'
  | 'food.validation.bagWeightUnitRequiredForUpdate'
  | 'food.validation.brandNameTooLong'
  | 'food.validation.dailyAmountExceedsBagWeight'
  | 'food.validation.dailyAmountExceedsTotalWeight'
  | 'food.validation.dailyAmountMustBePositive'
  | 'food.validation.dailyAmountRequired'
  | 'food.validation.dateStartedRequired'
  | 'food.validation.invalidBagWeightUnit'
  | 'food.validation.invalidWetFoodUnit'
  | 'food.validation.numberOfUnitsMustBePositive'
  | 'food.validation.numberOfUnitsRequired'
  | 'food.validation.productNameTooLong'
  | 'food.validation.weightPerUnitMustBePositive'
  | 'food.validation.weightPerUnitRequired'
  | 'food.validation.wetFoodUnitRequired'
  | 'food.validation.wetFoodUnitRequiredForUpdate'
  // notes.validation.*
  | 'notes.validation.contentRequired'
  | 'notes.validation.contentTooLong'
  // pets.validation.*
  | 'pets.validation.animalTypeRequired'
  | 'pets.validation.invalidBirthDate'
  | 'pets.validation.genderRequired'
  | 'pets.validation.microchipInvalidChars'
  | 'pets.validation.microchipTooLong'
  | 'pets.validation.microchipTooShort'
  | 'pets.validation.nameInvalidChars'
  | 'pets.validation.nameRequired'
  | 'pets.validation.nameTooLong'
  | 'pets.validation.notesTooLong'
  | 'pets.validation.speciesInvalidChars'
  | 'pets.validation.speciesTooLong'
  | 'pets.validation.weightExceedsMax'
  // weights.validation.*
  | 'weights.validation.absoluteMaxExceeded'
  | 'weights.validation.dateRequired'
  | 'weights.validation.invalidDate'
  | 'weights.validation.invalidWeightUnit'
  | 'weights.validation.maxMustExceedMin'
  | 'weights.validation.maxWeightMustBePositive'
  | 'weights.validation.maxWeightRequired'
  | 'weights.validation.minWeightMustBePositive'
  | 'weights.validation.minWeightRequired'
  | 'weights.validation.outOfAnimalRange'
  | 'weights.validation.targetOutOfAnimalRange'
  | 'weights.validation.weightMustBePositive'
  | 'weights.validation.weightRequired'
  | 'weights.validation.weightUnitRequiredForUpdate'
  // vets.validation.*
  | 'vets.validation.addressLine2TooLong'
  | 'vets.validation.addressRequired'
  | 'vets.validation.addressTooLong'
  | 'vets.validation.cityInvalidChars'
  | 'vets.validation.cityRequired'
  | 'vets.validation.cityTooLong'
  | 'vets.validation.clinicNameInvalidChars'
  | 'vets.validation.clinicNameTooLong'
  | 'vets.validation.emailTooLong'
  | 'vets.validation.invalidPetId'
  | 'vets.validation.invalidVetId'
  | 'vets.validation.notesTooLong'
  | 'vets.validation.phoneInvalid'
  | 'vets.validation.phoneRequired'
  | 'vets.validation.phoneTooLong'
  | 'vets.validation.selectAtLeastOnePet'
  | 'vets.validation.vetNameInvalidChars'
  | 'vets.validation.vetNameRequired'
  | 'vets.validation.vetNameTooLong'
  | 'vets.validation.websiteInvalid'
  | 'vets.validation.websiteTooLong'
  | 'vets.validation.websiteTooShort'
  | 'vets.validation.zipCodeInvalidChars'
  | 'vets.validation.zipCodeRequired'
  | 'vets.validation.zipCodeTooLong'
  // appointments.validation.*
  | 'appointments.validation.invalidAppointmentId'
  | 'appointments.validation.invalidTimeFormat'
  | 'appointments.validation.invalidType'
  | 'appointments.validation.petRequired'
  | 'appointments.validation.reasonTooLong'
  | 'appointments.validation.timeIncrementInvalid'
  | 'appointments.validation.timeRequired'
  | 'appointments.validation.typeRequired'
  | 'appointments.validation.vetRequired'
  | 'appointments.validation.visitNotesTooLong'
  // antiParasite.validation.*
  | 'antiParasite.validation.categoriesInvalid'
  | 'antiParasite.validation.categoriesRequired'
  | 'antiParasite.validation.dateRequired'
  | 'antiParasite.validation.durationAmountInvalid'
  | 'antiParasite.validation.durationAmountRequired'
  | 'antiParasite.validation.durationAmountRequiredForUpdate'
  | 'antiParasite.validation.durationCombinationInvalid'
  | 'antiParasite.validation.durationUnitRequiredForUpdate'
  | 'antiParasite.validation.invalidCategory'
  | 'antiParasite.validation.invalidDate'
  | 'antiParasite.validation.invalidDurationUnit'
  | 'antiParasite.validation.productNameRequired'
  | 'antiParasite.validation.productNameTooLong'
  | 'antiParasite.validation.durationRequired';
 

/** Identity at runtime; the whole point is the compile-time constraint. */
export const key = (k: ValidationMessageKey): string => k;