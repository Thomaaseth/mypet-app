import type { ValidationMessageKey } from '@/shared/validations/i18n-keys';
import type { TranslationKey } from '../translation-key';

/**
 * Compile-time-only check, no runtime behavior.
 *
 * `ValidationMessageKey` (packages/shared) is a hand-maintained list of the
 * keys the shared Zod schemas emit as validation messages. `TranslationKey`
 * (apps/web) is the real, derived-from-the-actual-resource-tree set of keys
 * that exist in en/*.ts.
 *
 * If someone adds a key to ValidationMessageKey but never adds the matching
 * string to the translation files (typo, forgot, renamed one side only),
 * this line stops satisfying the constraint and `tsc` fails right here
 */
type _AssertValidationKeysExistInTranslations = ValidationMessageKey extends TranslationKey
  ? true
  : ['ValidationMessageKey has a key that does not exist in the translation resources', ValidationMessageKey];

const _check: _AssertValidationKeysExistInTranslations = true;
void _check;